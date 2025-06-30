'use client'

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from "next-auth";
import { Button } from '../ui/button';
import { Home, Mail, LogIn, LogOut, User as UserIcon } from 'lucide-react';

function Navbar() {
    const { data: session } = useSession();
    const user = session?.user as User;

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Mail className="h-6 w-6 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                Mystery Message
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                           
                            <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/thoughts" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Thoughts
                            </Link>
                            <Link href="/confession" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Confession
                            </Link>
                            <Link href="/user-match" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Chat
                            </Link>
                        </div>
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {session ? (
                            <>
                                <div className="hidden md:flex items-center space-x-2">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-gray-300 text-sm font-medium">
                                        {user?.username || user?.email}
                                    </span>
                                </div>
                                <Button 
                                    onClick={() => signOut()}
                                    variant="outline"
                                    className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Link href="/sign-in">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Login
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden bg-gray-800">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {session && (
                        <div className="flex items-center px-3 py-2 text-gray-300">
                            <UserIcon className="h-5 w-5 mr-2" />
                            <span>{user?.username || user?.email}</span>
                        </div>
                    )}
                    <Link href="/" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Home
                    </Link>
                    <Link href="/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Dashboard
                    </Link>
                    {session ? (
                        <button
                            onClick={() => signOut()}
                            className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link href="/signin" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;