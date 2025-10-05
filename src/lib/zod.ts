import {object, string} from "zod";

export const RegisterSchema = object({
    name: string().min(1, "Nama harus lebih dari 1"),
    email: string().email("Format email invalid"),
    password: string()
        .min(8, "Password harus lebih dari 6 karakter")
        .max(32, "Password harus kurang dari 32 karakter"),
    ConfirmPassword: string()
        .min(8, "Password harus lebih dari 6 karakter")
        .max(32, "Password harus kurang dari 32 karakter")

}).refine((data) => data.password === data.ConfirmPassword, {
    message: "Password tidak matching",
    path:["ConfirmPassword"]
});