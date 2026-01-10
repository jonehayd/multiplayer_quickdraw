// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

export default function GuessDisplay({ guesses }) {
  return (
    <div className="guess-display">
      <h3>Guesses</h3>

      <ul>
        <AnimatePresence>
          {guesses.map((guess) => (
            <motion.li
              key={guess.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span>{guess.label.trim()}</span>
              <span>{guess.confidence}%</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
