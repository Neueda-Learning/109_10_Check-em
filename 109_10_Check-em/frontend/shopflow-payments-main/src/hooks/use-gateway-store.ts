import { useEffect, useState } from "react";

/** Re-render on any localStorage write done through the gateway helpers. */
export function useGatewayStore<T>(read: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener("novapay:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("novapay:change", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
