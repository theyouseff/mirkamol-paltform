type Brand = { title: string; brandName: string; logoUrl: string };

// Kursning logotipi (bo'lmasa — nomi)
export function CourseBrand({ course, className = "" }: { course: Brand; className?: string }) {
  if (course.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={course.logoUrl} alt={course.brandName || course.title} className={`h-10 w-auto object-contain ${className}`} />;
  }
  return <span className={`text-lg font-bold text-brand ${className}`}>{course.brandName || course.title}</span>;
}
