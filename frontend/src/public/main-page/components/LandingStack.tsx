import { Container } from "./ui";

const STACK = ["Ethereum Sepolia", "Solidity", "IPFS", "Pinata", "SHA-256", "MetaMask"];

export const LandingStack = () => (
  <section aria-labelledby="stack-heading" className="border-y border-neutral-200/80 bg-white/40 py-10">
    <Container className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
      <h2 id="stack-heading" className="text-sm font-medium text-neutral-500">
        Oparte na otwartych standardach
      </h2>
      <ul className="flex flex-wrap justify-center gap-x-10 gap-y-3">
        {STACK.map((item) => (
          <li key={item} className="text-lg font-semibold tracking-tight text-neutral-400">
            {item}
          </li>
        ))}
      </ul>
    </Container>
  </section>
);
