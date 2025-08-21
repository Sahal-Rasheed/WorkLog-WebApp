import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, Lock, AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [configError, setConfigError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // Check for environment variables on component mount
  useEffect(() => {
    
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ffkcpyyxvfxjsfmmylfz.supabase.co';
	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2NweXl4dmZ4anNmbW15bGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NzU0MjAsImV4cCI6MjA3MTM1MTQyMH0.TXvs2P9ardukGHaNVX3h8RwXW9_lvJ8ym8satFY-sAc';

    if (!supabaseUrl || !supabaseAnonKey) {
      setConfigError('Supabase configuration is missing. Please check your environment variables.');
    } else {
      setConfigError(null);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      toast({
        title: "Configuration Error",
        description: configError,
        variant: "destructive",
      });
      return;
    }

    const newErrors: string[] = [];
    
    if (!signInData.email.trim()) {
      newErrors.push('Email is required');
    } else if (!validateEmail(signInData.email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (!signInData.password) {
      newErrors.push('Password is required');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      setIsLoading(true);
      try {
        await signIn(signInData.email.trim(), signInData.password);
      } catch (error) {
        toast({
          title: "Sign In Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      toast({
        title: "Configuration Error",
        description: configError,
        variant: "destructive",
      });
      return;
    }

    const newErrors: string[] = [];
    
    if (!signUpData.email.trim()) {
      newErrors.push('Email is required');
    } else if (!validateEmail(signUpData.email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (!signUpData.name.trim()) {
      newErrors.push('Name is required');
    } else if (signUpData.name.trim().length < 2) {
      newErrors.push('Name must be at least 2 characters');
    }

    if (!signUpData.password) {
      newErrors.push('Password is required');
    } else if (signUpData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      setIsLoading(true);
      try {
        await signUp(signUpData.email.trim(), signUpData.password, signUpData.name.trim());
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account",
        });
      } catch (error) {
        toast({
          title: "Sign Up Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Worklog</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        {configError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {configError}
              <br />
              <span className="text-sm mt-2 block">
                Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signin-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@company.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !!configError}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@company.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading || !!configError}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !!configError}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
