import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import publicRouter from "./public";
import branchesRouter from "./branches";
import peopleRouter from "./people";
import departmentsRouter from "./departments";
import announcementsRouter from "./announcements";
import financeRouter from "./finance";
import attendanceRouter from "./attendance";
import storageRouter from "./storage";
import socialRouter from "./social";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(publicRouter);
router.use(branchesRouter);
router.use(peopleRouter);
router.use(departmentsRouter);
router.use(announcementsRouter);
router.use(financeRouter);
router.use(attendanceRouter);
router.use(storageRouter);
router.use(socialRouter);
router.use(settingsRouter);
router.use(dashboardRouter);

export default router;
