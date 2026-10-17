// Video boshqa qurilmada ochilgani uchun shu yerda to'xtatildi (pleyer ustida, bosishga xalaqit bermaydi: play bosilsa davom etadi)
export function OtherDeviceNotice() {
  return (
    <p className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-black/80 px-3 py-2 text-center text-sm text-white shadow-lg">
      Bu akkauntda boshqa qurilmada video ochildi. Bir vaqtda faqat bitta qurilmada ko&apos;rish mumkin — davom ettirish uchun play bosing.
    </p>
  );
}
