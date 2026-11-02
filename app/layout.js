import './globals.css';

export const metadata = { title: 'Nộp bài', description: 'Hệ thống nộp bài tập' };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
