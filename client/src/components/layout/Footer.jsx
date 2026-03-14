export default function Footer() {
    return (
        <footer className="border-t border-white/5 py-12 bg-wrap mt-auto">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="max-w-xs">
                   <h3 className="text-xl font-playfair font-bold text-brand-text mb-4 text-brand-gold">HumanHub</h3>
                   <p className="text-sm font-jakarta text-brand-muted">The internet, verified. A community platform mapping authentic discourse securely.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
                   <div>
                       <h4 className="font-jakarta text-white font-medium mb-4 text-sm">Product</h4>
                       <ul className="space-y-2 text-sm text-brand-muted">
                           <li className="hover:text-white cursor-pointer transition-colors">Features</li>
                           <li className="hover:text-white cursor-pointer transition-colors">Security</li>
                           <li className="hover:text-white cursor-pointer transition-colors">Pricing</li>
                       </ul>
                   </div>
                   <div>
                       <h4 className="font-jakarta text-white font-medium mb-4 text-sm">Company</h4>
                       <ul className="space-y-2 text-sm text-brand-muted">
                           <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                           <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                           <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                       </ul>
                   </div>
                   <div>
                       <h4 className="font-jakarta text-white font-medium mb-4 text-sm">Legal</h4>
                       <ul className="space-y-2 text-sm text-brand-muted">
                           <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
                           <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                       </ul>
                   </div>
                </div>
            </div>
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-brand-muted font-mono">
                <span>© 2026 HumanHub Technologies Pvt. Ltd.</span>
                <span>All content verified human.</span>
            </div>
        </footer>
    );
}
