use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

#[derive(Debug, Serialize, Deserialize)]
struct AppConfig {
    backend_url: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_backend_url(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let app_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    
    println!("App config dir: {}", app_dir.display());  
    
    // Create directory if it doesn't exist
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    let config_path = app_dir.join("config.json");
    
    if !config_path.exists() {
        return Ok(None);
    }
    
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    
    Ok(config.backend_url)
}

#[tauri::command]
fn set_backend_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let config_path = app_dir.join("config.json");
    
    let config = AppConfig {
        backend_url: Some(url),
    };
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn show_notification(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("notification")
        .ok_or_else(|| "Notification window not found".to_string())?;
    
    window.show().map_err(|e| format!("Failed to show window: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn hide_notification(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("notification")
        .ok_or_else(|| "Notification window not found".to_string())?;
    
    window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn position_notification(
    app: tauri::AppHandle,
    width: Option<f64>,
    height: Option<f64>
) -> Result<(), String> {
    let window = app
        .get_webview_window("notification")
        .ok_or_else(|| "Notification window not found".to_string())?;
    
    // Default dimensions if not provided
    let popup_width = width.unwrap_or(380.0) as u32;
    let popup_height = height.unwrap_or(120.0) as u32;
    let margin = 24.0;
    
    // Resize window first
    window
        .set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: popup_width,
            height: popup_height,
        }))
        .map_err(|e| format!("Failed to resize window: {}", e))?;
    
    // Get the primary monitor (most reliable)
    let monitor = window
        .primary_monitor()
        .map_err(|e| format!("Failed to get primary monitor: {}", e))?
        .ok_or_else(|| "No primary monitor found".to_string())?;
    
    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    
    // Calculate position at bottom-right of screen
    let x = monitor_position.x + (monitor_size.width as f64 - popup_width as f64 - margin) as i32;
    let y = monitor_position.y + (monitor_size.height as f64 - popup_height as f64 - margin) as i32;
    
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| format!("Failed to set position: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize autostart plugin
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    None::<Vec<&str>>,
                ));
            }
            
            // Create system tray menu items
            let show_i = MenuItem::with_id(app, "show", "Open Sentio", true, None::<&str>)
                .map_err(|e| format!("Failed to create show menu item: {}", e))?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
                .map_err(|e| format!("Failed to create quit menu item: {}", e))?;
            
            // Create menu
            let menu = Menu::with_items(app, &[&show_i, &quit_i])
                .map_err(|e| format!("Failed to create menu: {}", e))?;
            
            // Create tray icon with menu and event handlers
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |_tray, event| {
                    let app = _tray.app_handle();
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|_tray, event| {
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            // Double-click or left click to show window
                            let app = _tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)
                .map_err(|e| format!("Failed to build tray icon: {}", e))?;
            
            Ok(())
        })
        .on_window_event(|_app, event| {
            // When main window is closed, hide it instead of quitting
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Some(window) = _app.get_webview_window("main") {
                    window.hide().unwrap_or_default();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_backend_url,
            set_backend_url,
            show_notification,
            hide_notification,
            position_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
