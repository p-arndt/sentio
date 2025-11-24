<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertCircle, CheckCircle2, Loader2, Server } from '@lucide/svelte';
	import { setBackendUrl, isBackendConfigured } from '$lib/client/config';

	let backendUrl = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let isTesting = $state(false);
	let testResult = $state<'success' | 'error' | null>(null);

	onMount(async () => {
		// Check if backend is already configured
		const configured = await isBackendConfigured();
		if (configured) {
			// Already configured, redirect to home
			goto('/');
		}
	});

	async function testConnection() {
		if (!backendUrl.trim()) {
			error = 'Please enter a backend URL';
			return;
		}

		isTesting = true;
		testResult = null;
		error = null;

		try {
			// Test the connection by trying to fetch a simple endpoint
			// Try /api/version or just the root
			const testUrl = backendUrl.replace(/\/$/, '') + '/api/version';
			const response = await fetch(testUrl, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				testResult = 'success';
			} else {
				testResult = 'error';
				error = `Connection failed: ${response.status} ${response.statusText}`;
			}
		} catch (err) {
			testResult = 'error';
			error = err instanceof Error ? err.message : 'Failed to connect to backend';
		} finally {
			isTesting = false;
		}
	}

	async function handleSubmit() {
		if (!backendUrl.trim()) {
			error = 'Please enter a backend URL';
			return;
		}

		// Validate URL format
		try {
			new URL(backendUrl);
		} catch {
			error = 'Please enter a valid URL (e.g., https://api.example.com)';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			// Save the backend URL
			await setBackendUrl(backendUrl.trim());
			
			// Test the connection
			await testConnection();
			
			if (testResult === 'success') {
				// Redirect to home after successful setup
				setTimeout(() => {
					goto('/');
				}, 1000);
			} else {
				isSubmitting = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save backend URL';
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Setup - Sentio</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="space-y-1 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Server class="h-8 w-8 text-primary" />
			</div>
			<CardTitle class="text-2xl">Welcome to Sentio</CardTitle>
			<CardDescription>
				Let's get started by connecting to your backend server
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				<div class="space-y-2">
					<Label for="backend-url">Backend URL</Label>
					<Input
						id="backend-url"
						type="url"
						placeholder="https://api.example.com"
						bind:value={backendUrl}
						disabled={isSubmitting || isTesting}
						required
					/>
					<p class="text-xs text-muted-foreground">
						Enter the URL where your Sentio backend server is hosted
					</p>
				</div>

				{#if error}
					<Alert variant="destructive">
						<AlertCircle class="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				{#if testResult === 'success'}
					<Alert>
						<CheckCircle2 class="h-4 w-4" />
						<AlertDescription>Connection successful! Redirecting...</AlertDescription>
					</Alert>
				{/if}

				<div class="flex gap-2">
					<Button
						type="button"
						variant="outline"
						onclick={testConnection}
						disabled={isSubmitting || isTesting || !backendUrl.trim()}
						class="flex-1"
					>
						{#if isTesting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Testing...
						{:else}
							Test Connection
						{/if}
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || isTesting || !backendUrl.trim()}
						class="flex-1"
					>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Setting up...
						{:else}
							Continue
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>

