import { AlertCircle } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
  error?: string
}

export function InputField({ label, icon: Icon, error, ...props }: InputFieldProps) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className={`
        relative flex items-center transition-all duration-200
        bg-zinc-900/50 border rounded-lg overflow-hidden
        ${error 
          ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20' 
          : 'border-zinc-800 hover:border-zinc-700 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20'}
      `}>
        <div className="pl-3 pr-2 text-zinc-500">
          <Icon size={16} />
        </div>
        <input
          className="w-full bg-transparent border-none text-sm text-white p-3 placeholder-zinc-600 focus:outline-none focus:ring-0"
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 ml-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

