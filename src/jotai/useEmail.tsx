import { atom, useAtom } from 'jotai'

export const emailAtom = atom<null | string>(null)

export default function useEmail() {
  const [email, setEmail] = useAtom(emailAtom)

  return { email, setEmail }
}
