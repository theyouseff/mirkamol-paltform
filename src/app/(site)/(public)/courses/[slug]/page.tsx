import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandScope } from "@/components/BrandScope";
import { DEMO_LESSON_COUNT, VideoLessonGrid } from "@/components/VideoLessonGrid";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course || !course.published) notFound();

  return (
    <BrandScope color={course.brandColor}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/courses" className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← Kurslar</Link>

        <div className="mt-5">
          {course.logoUrl && (
            <div className="mb-5 inline-block rounded-xl bg-white px-4 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.logoUrl} alt={course.brandName || course.title} className="h-10 w-auto object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="mt-3 text-lg text-gold-text/85">{course.subtitle}</p>}
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-gold-text/70">{DEMO_LESSON_COUNT} ta video dars</p>
        </div>

        <div className="mt-5">
          <VideoLessonGrid />
        </div>
      </div>
    </BrandScope>
  );
}
