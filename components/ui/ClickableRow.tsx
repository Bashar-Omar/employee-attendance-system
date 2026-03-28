"use client"
import { useRouter } from "next/navigation"

interface ClickableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    href: string
    children: React.ReactNode
}

export function ClickableRow({ href, children, className, ...props }: ClickableRowProps) {
    const router = useRouter()
    return (
        <tr 
            onClick={() => router.push(href)} 
            className={`cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </tr>
    )
}
