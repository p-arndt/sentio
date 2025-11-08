# Copilot Instructions for Svelte 5 Projects

## General Coding Practices

- Write idiomatic Svelte 5 code, using modern best practices.
- Prefer concise, readable, and maintainable code.
- Always use TypeScript for new components and utilities.
- Add clear type annotations for all props and variables.
- Write components as function modules (not class-based).

## Svelte 5 Specifics

- Use the new Svelte 5 syntax, including:
- `$state(value)` for state variables (do not import `$state`—assume it is globally available).
- `$effect(() => { ... })` for effects instead of `$:`. But don't overuse it; prefer `$derived` for derived state if possible.
- `$derived()` or `$derived.by(()=>{ /* complex logic */ return result})` for derived state.
- Component props: declare props with types using the new `type Props = { ... }` and `let { prop } = $props();` pattern.
- Use normal HTML element events (e.g., `on:click` is now `onclick`).
- Avoid legacy Svelte 3/4 patterns.
- Instead of `onclick|preventDefault`, use `onclick={(event) => { event.preventDefault(); ... }}` for event handling.
- `<svelte:component>` is deprecated in runes mode — components are dynamic by default like `<MyComponent />` or as attributes `<props.icon/>`

## Imports & Structure

- For external libraries (like shadcn-svelte, @lucide/svelte, etc.), use named imports and group similar imports together.
- For local components, use default imports.
- Use the `$lib` alias for all imports within your own codebase (shared modules, components, utilities, etc.); use absolute imports only for node_modules.
- Import Shadcn components from `$lib/components/ui` when applicable.
- Use icons from `@lucide/svelte` with named imports.

## Styling

- Use Tailwind CSS for all styling.
- Do not write raw CSS or use <style> unless absolutely necessary.
- Prefer utility classes and design tokens (if project-specific).

## Project Structure

- Place reusable components in `$lib/components`.
- Store page routes in `/routes`.
- Use `$lib` for shared logic, stores, and utilities.
- Follow SvelteKit’s standard file organization.

## Accessibility & UI

- Ensure interactive components are accessible (keyboard nav, ARIA where relevant).
- Use semantic HTML.
- Ensure color contrast and focus states in UI components.

## Comments

- Use comments to explain complex logic or important decisions.
- Avoid commenting on obvious code; let the code speak for itself.
- DON'T COMMENT WHAT YOU HAVE CHANGED

---

# Example: Svelte 5 Component Template

```svelte
<script lang="ts">
	type Props = {
		label: string;
		onClick?: () => void;
	};
	let { label, onClick } = $props();
	let count = $state(0);
	let doubled = $derived(count * 2);
	let complexValue = $derived.by(() => {
		// Some complex logic that returns a value
		return count * 3; // Example logic
	});

	$effect(() => {
		// Your effect here
	});
</script>

<button onclick={onClick} class="bg-primary rounded-xl px-4 py-2 text-white">
	{label} ({count}) (doubled: {doubled}) (complex: {complexValue})
</button>
```
