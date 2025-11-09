<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Check, Eye, EyeOff, Lock, Mail, Shield, User, X } from '@lucide/svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let loading = $state(false);
	let passwordStrength = $state(0);
	let invitationToken = $state('');

	$effect(() => {
		// Extract invitation token from query param and pre-fill email
		const token = page.url.searchParams.get('invitationToken');
		if (token) {
			invitationToken = token;
			// Pre-fill email from the invitation data
			if (data.invitationEmail) {
				email = data.invitationEmail;
			}
		}
	});

	$effect(() => {
		passwordStrength = calculatePasswordStrength(password);
	});

	function calculatePasswordStrength(pwd: string): number {
		let strength = 0;
		if (pwd.length >= 8) strength++;
		if (/[a-z]/.test(pwd)) strength++;
		if (/[A-Z]/.test(pwd)) strength++;
		if (/[0-9]/.test(pwd)) strength++;
		if (/[^A-Za-z0-9]/.test(pwd)) strength++;
		return strength;
	}

	async function register(e: Event) {
		e.preventDefault();
		error = '';

		if (!name.trim()) {
			error = 'Name is required';
			return;
		}

		if (!email.trim()) {
			error = 'Email is required';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		try {
			await authClient.signUp.email({ email, password, name: name.trim() });

			// If we have an invitation token, accept it after signup
			if (invitationToken) {
				try {
					const res = await fetch('/api/invitations/accept', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ token: invitationToken })
					});

					const result = await res.json();
					if (res.ok) {
						// Redirect to dashboard or team page
						if (result.type === 'team' && result.teamId) {
							goto(`/teams/${result.teamId}`);
						} else {
							goto('/');
						}
						return;
					}
				} catch (inviteErr) {
					console.error('Error accepting invitation:', inviteErr);
					// Fall through to redirect to dashboard
				}
			}

			goto('/');
		} catch (e: any) {
			error = e.message || 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Account - Sentio</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
				<User class="h-8 w-8 text-primary-foreground" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">Create Account</CardTitle>
			{#if invitationToken}
				<p class="mt-2 text-muted-foreground">
					You were invited to join! Create your account below.
				</p>
			{:else if data.hasValidInvitation === false}
				<p class="mt-2 text-muted-foreground">Sign up is by invitation only</p>
			{:else}
				<p class="mt-2 text-muted-foreground">Join us and start your journey</p>
			{/if}
		</CardHeader>
		<CardContent class="pt-6">
			<form onsubmit={register} class="space-y-6">
				<!-- Name Field -->
				<div class="space-y-2">
					<Label for="name" class="text-sm font-medium text-foreground">Full Name</Label>
					<div class="relative">
						<User
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="name"
							type="text"
							placeholder="Enter your full name"
							bind:value={name}
							required
							class="h-12 border-border bg-background pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
					</div>
				</div>

				<!-- Email Field -->
				<div class="space-y-2">
					<Label for="email" class="text-sm font-medium text-foreground">Email Address</Label>
					<div class="relative">
						<Mail
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							bind:value={email}
							required
							class="h-12 border-border bg-background pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-2">
					<Label for="password" class="text-sm font-medium text-foreground">Password</Label>
					<div class="relative">
						<Lock
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Create a strong password"
							bind:value={password}
							required
							minlength={8}
							class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Confirm Password Field -->
				<div class="space-y-2">
					<Label for="confirmPassword" class="text-sm font-medium text-foreground"
						>Confirm Password</Label
					>
					<div class="relative">
						<Lock
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder="Confirm your password"
							bind:value={confirmPassword}
							required
							class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
						<button
							type="button"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showConfirmPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
					{#if confirmPassword && password !== confirmPassword}
						<p class="flex items-center gap-1 text-xs text-destructive">
							<X class="h-4 w-4" />
							Passwords do not match
						</p>
					{:else if confirmPassword && password === confirmPassword}
						<p class="flex items-center gap-1 text-xs text-chart-4">
							<Check class="h-4 w-4" />
							Passwords match
						</p>
					{/if}
				</div>

				<!-- Error Message -->
				{#if error}
					<div
						class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
					>
						<X class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{error}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<Button
					type="submit"
					disabled={loading}
					class="h-12 w-full transform rounded-lg bg-primary font-medium text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<div class="flex items-center gap-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></div>
							Creating Account...
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<Shield class="h-5 w-5" />
							Create Account
						</div>
					{/if}
				</Button>
			</form>

			<!-- Login Link -->
			<div class="mt-6 text-center">
				<p class="text-muted-foreground">
					Already have an account?
					<a href="/login" class="ml-1 font-medium text-primary hover:underline">Sign in here</a>
				</p>
			</div>
		</CardContent>
	</Card>
</div>
