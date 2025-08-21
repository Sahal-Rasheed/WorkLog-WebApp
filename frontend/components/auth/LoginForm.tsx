import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '../../utils/validation';

interface LoginFormProps {
  onSubmit: (email: string, name: string) => Promise<void>;
  loading?: boolean;
}

export function LoginForm({ onSubmit, loading = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: string[] = [];
    
    if (!email.trim()) {
      newErrors.push('Email is required');
    } else if (!validateEmail(email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (!name.trim()) {
      newErrors.push('Name is required');
    } else if (name.trim().length < 2) {
      newErrors.push('Name must be at least 2 characters');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      try {
        await onSubmit(email.trim(), name.trim());
      } catch (error) {
        toast({
          title: "Login Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Worklog</CardTitle>
        <CardDescription>
          Enter your details to get started with time tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
