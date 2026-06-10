import { application } from "controllers/application"

import HelloController from "hello_controller"
application.register("hello", HelloController)