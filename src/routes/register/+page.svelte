<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { User, Mail, Lock, Eye, EyeOff, Check, X, Shield } from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let termsAccepted = $state(false);
	let error = $state('');
	let loading = $state(false);
	let passwordStrength = $state(0);

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

	function getStrengthColor(strength: number): string {
		if (strength <= 2) return 'bg-destructive';
		if (strength <= 3) return 'bg-chart-1';
		if (strength <= 4) return 'bg-primary';
		return 'bg-chart-4';
	}

	function getStrengthText(strength: number): string {
		if (strength <= 2) return 'Weak';
		if (strength <= 3) return 'Fair';
		if (strength <= 4) return 'Good';
		return 'Strong';
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
			goto('/login');
		} catch (e: any) {
			error = e.message || 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
				<User class="h-8 w-8 text-primary-foreground" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">Create Account</CardTitle>
			<p class="mt-2 text-muted-foreground">Join us and start your journey</p>
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
