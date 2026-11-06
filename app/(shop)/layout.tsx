import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/data";

export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <>
      <Header categories={categories} />
      <main className="container-x py-6">{children}</main>
      <Footer />
    </>
  );
}
