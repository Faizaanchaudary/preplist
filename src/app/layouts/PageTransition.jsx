import { motion } from "framer-motion";
import { pageVariants } from "../../shared/motion/pageVariants";

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-[calc(100vh-132px)]"
    >
      {children}
    </motion.div>
  );
}