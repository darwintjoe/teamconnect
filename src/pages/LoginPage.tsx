import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface LoginPageProps {
  onLogin: (email: string) => { success: boolean; message: string };
  onRegister: (name: string, email: string, role?: string) => { success: boolean; message: string };
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerRole, setRegisterRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = () => {
    setError('');
    setSuccess('');
    
    if (!loginEmail.trim()) {
      setError('Please enter your email');
      return;
    }

    const result = onLogin(loginEmail.trim());
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleRegister = () => {
    setError('');
    setSuccess('');
    
    if (!registerName.trim() || !registerEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const result = onRegister(
      registerName.trim(),
      registerEmail.trim(),
      registerRole.trim() || 'Team Member'
    );
    
    if (result.success) {
      setSuccess('Registration successful! You are now logged in.');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#1877F2]">TeamConnect</h1>
          <p className="text-[15px] text-[#65676B] mt-2">
            Connect with your team, share updates, and stay in sync.
          </p>
        </div>

        {/* Auth form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-[14px]">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-[14px]">
                {success}
              </div>
            )}

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button
                className="w-full bg-[#1877F2] hover:bg-[#166fe5]"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <p className="text-[13px] text-[#65676B] text-center">
                Demo accounts: alex@company.com, sarah@company.com
              </p>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="register-name">Full Name *</Label>
                <Input
                  id="register-name"
                  placeholder="John Doe"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="register-email">Email *</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@company.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="register-role">Role (optional)</Label>
                <Input
                  id="register-role"
                  placeholder="e.g. Product Manager"
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-[#42B72A] hover:bg-[#36a420]"
                onClick={handleRegister}
              >
                Create Account
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-[13px] text-[#65676B] text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
