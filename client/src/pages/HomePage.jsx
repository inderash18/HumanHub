import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="bg-brand-bg text-brand-text min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl font-bold">HumanHub</h1>
        <p className="text-xl mt-4">The internet, verified.</p>
      </motion.div>
    </div>
  )
}