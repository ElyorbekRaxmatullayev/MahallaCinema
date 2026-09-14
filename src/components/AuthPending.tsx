// Shown instead of a hard 404 while the session cookie hasn't landed yet
// (TelegramAuthBootstrap verifies initData client-side after mount, then
// calls router.refresh() — this replaces itself with the real page content).
export default function AuthPending() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Загрузка...
    </div>
  );
}
