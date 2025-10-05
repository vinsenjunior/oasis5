"use server";

import { RegisterSchema } from "@/lib/zod";
import { hashSync } from  "bcrypt";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
 

export const SignUpCredentials = async(prevState: unknown, formData: FormData) => {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success){
        return{
            error: validatedFields.error.flatten().fieldErrors
        }
    }
    const {name, email, password} = validatedFields.data
    const hashedPassword = hashSync(password,10);

    try {
        await db.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
            }
        })
    } catch (error){
        return {message: "Gagal menambahkan user"}
    }
    redirect("/login");
}

