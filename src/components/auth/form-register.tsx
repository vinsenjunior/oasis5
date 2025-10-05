"use client"

import Link from "next/link";
import { SignUpCredentials } from '@/lib/actions';
import React from "react";

const FormRegister = () => {

    const[state, formAction] =  React.useActionState(SignUpCredentials,null);
    return(
        <form action={formAction} className='space-y-6'>
            <div>
                <label htmlFor="name" className='block mb-2 text-sm font-medium text-gray-900'>User name</label>
                <input className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg w-full p-2.5'
                 type="text" name="name" 
                 placeholder="User">
                </input>
                <div aria-live='polite' aria-atomic='true'>
                    <span className='text-sm text-red-500 mt-2'>{state?.error?.name}</span>
                </div>
            </div>

            <div>
                <label htmlFor="email" className='block mb-2 text-sm font-medium text-gray-900'>Email</label>
                <input className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg w-full p-2.5'
                    type="email" 
                    name="email" 
                    placeholder="user@email.com">
                </input>
                <div aria-live='polite' aria-atomic='true'>
                    <span className='text-sm text-red-500 mt-2'>{state?.error?.email}</span>
                </div>
            </div>

           <div>
                <label htmlFor="password" className='block mb-2 text-sm font-medium text-gray-900'>Password</label>
                <input className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg w-full p-2.5'
                    type="password" 
                    name="password" 
                    placeholder="******">
                </input>
                <div aria-live='polite' aria-atomic='true'>
                    <span className='text-sm text-red-500 mt-2'>{state?.error?.password}</span>
                </div>
            </div>

            <div>
                <label htmlFor="ConfirmPassword" className='block mb-2 text-sm font-medium text-gray-900'>Konfirmasi Password</label>
                <input className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg w-full p-2.5'
                    type="ConfirmPassword"
                    name="ConfirmPassword" 
                    placeholder="******">
                </input>
                <div aria-live='polite' aria-atomic='true'>
                    <span className='text-sm text-red-500 mt-2'>{state?.error?.ConfirmPassword}</span>
                </div>
            </div>
        <button className='w-full text-white bg-blue-700 font-medium rounded-lg px-5 py-2.5 text-center hover:bg-blue-800'
            type="submit" 
            >Register
        </button>
        <p className='text-sm font-light text-gray-500'>Sudah punya akun?</p>
        <Link href="/login"><span className='font-medium pl-1 text-blue-500 hover:text-blue-700'>Sign-in</span></Link>
        </form>

    )

}
export default FormRegister