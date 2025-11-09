<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Shield, Eye, EyeOff, Check, X, AlertCircle } from '@lucide/svelte';
	import type { ActionData } from './$types';

	type Props = {
		form?: ActionData;
	};

	let { form }: Props = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);

	function validateForm(): boolean {
		if (!name.trim()) {
			return false;
		}
		if (!email.trim()) {
			return false;
		}
		if (password.length < 8) {
			return false;
		}
		if (password !== confirmPassword) {
			return false;
		}
		return true;
	}

	function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		loading = true;
	}
</script>

<svelte:head>
	<title>Initialize Admin Account - Sentio</title>
</svelte:head>
<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	{#if form?.success}
		<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
			<CardHeader class="pb-2 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-chart-4"
				>
					<Check class="h-8 w-8 text-primary-foreground" />
				</div>
				<CardTitle class="text-2xl font-bold text-primary">Admin Created!</CardTitle>
				<p class="mt-2 text-muted-foreground">Your admin account has been created successfully.</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<p class="text-center text-sm text-muted-foreground">
					You can now log in with your credentials and start managing the application.
				</p>
				<Button href="/login" class="w-full" size="lg">Go to Login</Button>
			</CardContent>
		</Card>
	{:else}
		<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
			<CardHeader class="pb-2 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary"
				>
					<Shield class="h-8 w-8 text-primary-foreground" />
				</div>
				<CardTitle class="text-2xl font-bold text-primary">Initialize Admin Account</CardTitle>
				<p class="mt-2 text-muted-foreground">Create the first admin account to get started</p>
			</CardHeader>
			<CardContent class="pt-6">
				<!-- Error Alert -->
				{#if form?.error}
					<div
						class="mb-6 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
					>
						<AlertCircle class="h-5 w-5 shrink-0 text-destructive" />
						<div>
							<p class="text-sm font-medium text-destructive">{form.error}</p>
						</div>
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance={() => handleSubmit()} class="space-y-6">
					<!-- Name Field -->
					<div class="space-y-2">
						<Label for="name" class="text-sm font-medium text-foreground">Full Name</Label>
						<Input
							type="text"
							id="name"
							name="name"
							bind:value={name}
							placeholder="John Doe"
							disabled={loading}
							required
						/>
					</div>

					<!-- Email Field -->
					<div class="space-y-2">
						<Label for="email" class="text-sm font-medium text-foreground">Email Address</Label>
						<Input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							placeholder="admin@example.com"
							disabled={loading}
							required
						/>
					</div>

					<!-- Password Field -->
					<div class="space-y-2">
						<Label for="password" class="text-sm font-medium text-foreground">Password</Label>
						<div class="relative">
							<Input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								bind:value={password}
								placeholder="••••••••"
								disabled={loading}
								minlength={8}
								required
								class="pr-10"
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								disabled={loading}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
						<p class="text-xs text-muted-foreground">Minimum 8 characters</p>
					</div>

					<!-- Confirm Password Field -->
					<div class="space-y-2">
						<Label for="confirmPassword" class="text-sm font-medium text-foreground">
							Confirm Password
						</Label>
						<div class="relative">
							<Input
								type={showConfirmPassword ? 'text' : 'password'}
								id="confirmPassword"
								name="confirmPassword"
								bind:value={confirmPassword}
								placeholder="••••••••"
								disabled={loading}
								minlength={8}
								required
								class="pr-10"
							/>
							<button
								type="button"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								disabled={loading}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
							>
								{#if showConfirmPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<!-- Validation Messages -->
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							{#if name.trim()}
								<Check class="h-4 w-4 text-chart-4" />
							{:else}
								<X class="h-4 w-4 text-muted-foreground" />
							{/if}
							<span class={name.trim() ? 'text-muted-foreground' : 'text-muted-foreground'}>
								Name provided
							</span>
						</div>
						<div class="flex items-center gap-2">
							{#if email.includes('@')}
								<Check class="h-4 w-4 text-chart-4" />
							{:else}
								<X class="h-4 w-4 text-muted-foreground" />
							{/if}
							<span class={email.includes('@') ? 'text-muted-foreground' : 'text-muted-foreground'}>
								Valid email
							</span>
						</div>
						<div class="flex items-center gap-2">
							{#if password.length >= 8}
								<Check class="h-4 w-4 text-chart-4" />
							{:else}
								<X class="h-4 w-4 text-muted-foreground" />
							{/if}
							<span
								class={password.length >= 8 ? 'text-muted-foreground' : 'text-muted-foreground'}
							>
								Password at least 8 characters
							</span>
						</div>
						<div class="flex items-center gap-2">
							{#if password && confirmPassword && password === confirmPassword}
								<Check class="h-4 w-4 text-chart-4" />
							{:else}
								<X class="h-4 w-4 text-muted-foreground" />
							{/if}
							<span
								class={password === confirmPassword && password
									? 'text-muted-foreground'
									: 'text-muted-foreground'}
							>
								Passwords match
							</span>
						</div>
					</div>

					<!-- Submit Button -->
					<Button type="submit" disabled={loading || !validateForm()} class="w-full" size="lg">
						{#if loading}
							<div
								class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></div>
							Creating Admin Account...
						{:else}
							Create Admin Account
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
