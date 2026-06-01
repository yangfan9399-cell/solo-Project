import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>;
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = function CardTitle({ children, className = "" }: CardTitleProps) {
  return <h3 className={`text-lg font-medium text-gray-900 ${className}`}>{children}</h3>;
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = function CardFooter({ children, className = "" }: CardFooterProps) {
  return <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}>{children}</div>;
};
