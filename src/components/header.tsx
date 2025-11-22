import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="border-b bg-white h-16 flex items-center px-6 shadow-sm">
      {/* Логотип-ссылка на главную */}
      <Link href="/" className="relative w-48 h-10 block">
        <Image 
          src="/logo.png" 
          alt="МСМ Сервис" 
          fill 
          className="object-contain object-left"
          priority
        />
      </Link>

      {/* Справа можно будет потом добавить аватарку пользователя */}
      <div className="ml-auto text-sm text-gray-500">
        {/* Место для будущей менюшки */}
      </div>
    </header>
  )
}