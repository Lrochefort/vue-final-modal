import { createVfm } from '@lrochefort/vue-final-modal'
import '@lrochefort/vue-final-modal/style.css'

export default {
  extend({ app }: any) {
    app.use(createVfm())
  },
}
