import Navigation from '@/components/Navigation'

interface Props {
  children: React.ReactNode
}

export default function AutoAppLayout({ children }: Props) {
  return (
    <div className="min-h-screen">
      <Navigation>
        {children}
      </Navigation>
    </div>
  )
}