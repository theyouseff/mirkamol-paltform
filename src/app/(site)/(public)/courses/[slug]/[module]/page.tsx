import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandScope } from "@/components/BrandScope";
import { VideoLessonGrid } from "@/components/VideoLessonGrid";
import { findDemoModule } from "@/lib/demo-course";

export default async function ModulePage({ params }: { params: Promise<{ slug: string; module: string }> }) {
  const { slug, module: moduleSlug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  const found = findDemoModule(moduleSlug);
  if (!course || !course.published || !found) notFound();
  const { module: mod, number } = found;

  return (
    <BrandScope color={course.brandColor}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href={`/courses/${course.slug}`} className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← {course.title}</Link>

        <div className="mt-5">
          <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">{number}-modul</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{mod.title}</h1>
          <p className="mt-3 text-lg text-gold-text/85">{mod.description}</p>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-gold-text/70">{mod.lessons.length} ta video dars</p>
        </div>

        <div className="mt-5">
          <VideoLessonGrid lessons={mod.lessons} />
        </div>
      </div>
    </BrandScope>
  );
}
