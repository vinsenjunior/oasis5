import React from 'react'
import FormRegister from  "@/components/auth/form-register";

const Register = () => {
    return(
        <div className='p-6 space-y-4'>
            <h1 className='text-2xl font-bold text-gray-900'>Buat akun</h1>
            <FormRegister/>
        </div>
    )

}
export default Register

