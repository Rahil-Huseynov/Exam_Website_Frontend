import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { BookOpen, TrendingUp, Award, Clock, Users, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Universitetlər üçün onlayn imtahan platforması</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                İmtahana hazırlaşın,
              </span>
              <br />
              <span className="text-foreground">uğur qazanın</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
              Universitetlərin real imtahan sualları ilə məşq edin. Nəticələrinizi izləyin və imtahana tam hazır olun.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                <Link href="/register">İndi başla</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg bg-transparent">
                <Link href="/login">Daxil ol</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-sm text-muted-foreground">İmtahan sualı</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">Universitet</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  1000+
                </div>
                <div className="text-sm text-muted-foreground">Aktiv tələbə</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      <section id="features" className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Niyə ExamPro?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Müasir texnologiya ilə təhsil alanının ən yaxşı imtahan hazırlıq platforması
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 space-y-4 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 rounded-3xl bg-gradient-to-br from-card to-primary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Real İmtahan Sualları</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ölkə universitetlərinin orijinal imtahan sualları ilə məşq edin və özünüzü yoxlayın
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 rounded-3xl bg-gradient-to-br from-card to-secondary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <TrendingUp className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Təfsilatı İzləmə</h3>
              <p className="text-muted-foreground leading-relaxed">
                Performansınızı izləyin və nəticələrinizin təfsilatlı analitikasını görün
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 rounded-3xl bg-gradient-to-br from-card to-accent/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-success flex items-center justify-center shadow-lg shadow-accent/25">
                <Clock className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Çevik Öyrənmə</h3>
              <p className="text-muted-foreground leading-relaxed">
                İstədiyiniz vaxt və tempodə öyrənin, limitsiz giriş imkanı
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-success/50 transition-all duration-300 hover:shadow-lg hover:shadow-success/10 rounded-3xl bg-gradient-to-br from-card to-success/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-lg shadow-success/25">
                <Award className="h-7 w-7 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Sertifikatlar</h3>
              <p className="text-muted-foreground leading-relaxed">
                Uğurlu imtahanlardan sonra rəsmi sertifikat əldə edin
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 rounded-3xl bg-gradient-to-br from-card to-primary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Canlı Dəstək</h3>
              <p className="text-muted-foreground leading-relaxed">Hər zaman komandamızdan kömək və məsləhət alın</p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 rounded-3xl bg-gradient-to-br from-card to-secondary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <Shield className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">Təhlükəsiz Platform</h3>
              <p className="text-muted-foreground leading-relaxed">
                Məlumatlarınızın təhlükəsizliyi bizim üçün prioritetdir
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto p-12 md:p-16 text-center space-y-8 border-2 rounded-3xl bg-gradient-to-br from-card to-primary/5 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">İmtahana hazırsınız?</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              İndi qoşulun və minlərlə tələbə ilə birlikdə öyrənin
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                <Link href="/register">Pulsuz başla</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
