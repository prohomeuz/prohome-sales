/**
 * @file Ovozli buyruq hook — oddiy yoq/o'chir.
 * @module features/voice-control/model/use-voice-command
 */

import { useCallback, useState } from "react";

// enabled: true  — mikrofon yoqilgan
// enabled: false — mikrofon o'chirilgan
export function useVoiceCommand() {
  const [enabled, setEnabled] = useState(false);
  const toggle = useCallback(() => setEnabled((v) => !v), []);
  return { enabled, toggle };
}
