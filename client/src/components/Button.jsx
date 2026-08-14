export default function Button({ children, className = '', variant = 'primary', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{children}</button>; }
