import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Home, ShoppingCart, Utensils, Users, Briefcase, MessageSquare, Settings, LogOut, User, Code, Package, Gamepad2, DollarSign, Phone } from 'lucide-react'; // Import Gamepad2, DollarSign, Phone
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Marketplace', path: '/market', icon: ShoppingCart },
  { name: 'Food & Wellness', path: '/food-wellness', icon: Utensils },
  { name: 'Errands', path: '/errands', icon: Package },
  { name: 'Collaborators', path: '/collaborators', icon: Users },
  { name: 'Freelance', path: '/freelance', icon: Briefcase },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Tournaments', path: '/tournaments', icon: Gamepad2 },
  { name: 'Lost & Found', path: '/lost-found', icon: Package },
  { name: 'Cash Exchange', path: '/cash-exchange', icon: DollarSign },
  { name: 'Ambassador Program', path: '/ambassador', icon: Users },
];

const getPageTitle = (pathname: string) => {
  const item = navItems.find(item => item.path === pathname);
  if (item) return item.name;
  if (pathname.startsWith('/market/')) return 'Product Details';
  if (pathname.startsWith('/service/')) return 'Service Details';
  if (pathname.startsWith('/errand/')) return 'Errand Details';
  if (pathname.startsWith('/tracking/')) return 'Order Tracking';
  if (pathname.startsWith('/profile')) return 'Profile'; // Changed to /profile to match route
  if (pathname.startsWith('/developer')) return 'Developer Dashboard';
  return 'Dashboard'; // Default title
};

const Header: React.FC = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const { user, userProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
              <nav className="flex flex-col gap-2 pt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
                {userProfile?.isDeveloper && (
                  <Link
                    to="/developer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <Code className="h-4 w-4" />
                    Developer
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-lg font-bold text-primary">
            {title}
          </Link>
        </div>

        <nav className="hidden lg:flex items-center space-x-4">
          {navItems.map((item) => (
            <Button key={item.name} variant="ghost" asChild>
              <Link to={item.path}>{item.name}</Link>
            </Button>
          ))}
          {userProfile?.isDeveloper && (
            <Button variant="ghost" asChild>
              <Link to="/developer">Developer</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.profilePictureUrl || "/avatars/01.png"} alt={user.name} /> {/* Use userProfile */}
                    <AvatarFallback>{user.name ? user.name[0] : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;