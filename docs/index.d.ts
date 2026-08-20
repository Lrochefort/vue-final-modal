import { Vfm } from "@lrochefort/vue-final-modal"

declare module '#app' {
  interface NuxtApp {
    $vfm: Vfm
  }
}

export { }