# Copilot Instructions for Svelte 5 Projects

## General Coding Practices

* Generate idiomatic Svelte 5 runes code.
* Keep logic server-first, typed, testable, and secure.
* Use Tailwind for styling; shadcn-svelte for primitives.
* Use proper TypeScript types throughout.
* Favor composition over inheritance.

## Svelte 5 Specifics

* State: use `let x = $state(initial)`. **Do not import `$state`.**
* Derived: `let y = $derived(expr)` or `let y = $derived.by(() => { ... })`.
* Effects: `$effect(() => { ... })` sparingly; avoid for pure derivations.
* Props:

  ```ts
  type Props = { title: string }
  let { title }:Props = $props()
  ```
* DOM events are native: `onclick`, `oninput`, etc.
* For preventDefault: `onclick={(e)=>{ e.preventDefault(); ... }}`.
* Dynamic components: use variables directly (no `<svelte:component>` in runes). 
  ```svelte
  <script lang="ts">
	import MyComponent from '$lib/components/MyComponent.svelte';
	import { Bot } from '@lucide/svelte';
	let object = {
		icon: Bot
	}
  </script>

  <object.icon prop={value} />
  ```
* Checkout the [Svelte 5 llms.txt](https://svelte.dev/llms.txt) for more details. Use this as entry point to navigate to different llm.txt files

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
		const computed = count + 5;
		return computed * 3; // Example logic
	});

	$effect(() => {
		// Your effect here
	});
</script>

<button onclick={onClick} class="bg-primary rounded-xl px-4 py-2 text-white">
	{label} ({count}) (doubled: {doubled}) (complex: {complexValue})
</button>
```
