import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type QuestionType = 'single' | 'multiple' | 'boolean';

export type Course = {
  id: string;
  schoolId: string; // 数据归属学校
  title: string;
  desc?: string;
  status: '进行中' | '已归档';
  createdAt: string;
};
export type Exam = {
  id: string;
  schoolId?: string; // 归属学校（可选）
  courseId?: string;
  title: string;
  shuffle: boolean;
  showScore: boolean;
  showAnswers: boolean;
  showAnalysis: boolean;
  passScore: number; // 及格分
  status: '未开始' | '进行中' | '已结束';
  createdAt: string;
};
export type Question = {
  id: string;
  examId: string;
  type: QuestionType;
  stem: string;
  options?: { key: string; text: string }[]; // for single/multiple
  answer: string[]; // e.g., ['A'] or ['A','C'] or ['true']
  analysis?: string;
  score: number;
};
export type Submission = {
  id: string;
  examId: string;
  schoolId?: string; // 冗余便于监管按学校筛选
  user: string;
  answers: Record<string, string[]>; // qid -> selected
  score: number;
  passed: boolean;
  submittedAt: string;
};
export type Notification = {
  id: string;
  examId: string;
  channel: 'sms' | 'app' | 'email';
  to: string;
  sentAt: string;
};

@Injectable()
export class TrainingService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();
  courses: Course[] = [];
  exams: Exam[] = [];
  questions: Question[] = [];
  submissions: Submission[] = [];
  notifications: Notification[] = [];

  constructor() {
  }
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }
  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  // Courses
  listCourses(params?: { schoolId?: string }) {
    const sid = params?.schoolId;
    return sid ? this.courses.filter((c) => c.schoolId === sid) : this.courses;
  }
  createCourse(b: { title: string; desc?: string; schoolId?: string }) {
    if (!b?.title) throw new BadRequestException('title required');
    const rec: Course = {
      id: this.id('CRS'),
      schoolId: b.schoolId || 'sch-001',
      title: b.title,
      desc: b.desc,
      status: '进行中',
      createdAt: this.now(),
    };
    this.courses.unshift(rec);
    return rec;
  }

  updateCourse(id: string, b: Partial<Pick<Course, 'title' | 'desc' | 'status'>>) {
    const idx = this.courses.findIndex((c) => c.id === id);
    if (idx === -1) throw new BadRequestException('course not found');
    this.courses[idx] = { ...this.courses[idx], ...b };
    return this.courses[idx];
  }

  deleteCourse(id: string) {
    const before = this.courses.length;
    this.courses = this.courses.filter((c) => c.id !== id);
    return { ok: this.courses.length < before };
  }

  // Exams
  listExams(params?: { courseId?: string; schoolId?: string }) {
    const cid = params?.courseId;
    const sid = params?.schoolId;
    let arr = this.exams.slice();
    if (cid) arr = arr.filter((e) => e.courseId === cid);
    if (sid) arr = arr.filter((e) => e.schoolId === sid);
    return arr;
  }
  createExam(b: {
    title: string;
    courseId?: string;
    schoolId?: string;
    shuffle?: boolean;
    showScore?: boolean;
    showAnswers?: boolean;
    showAnalysis?: boolean;
    passScore?: number;
  }) {
    if (!b?.title) throw new BadRequestException('title required');
    const rec: Exam = {
      id: this.id('EX'),
      title: b.title,
      courseId: b.courseId,
      schoolId: b.schoolId || 'sch-001',
      shuffle: !!b.shuffle,
      showScore: b.showScore ?? true,
      showAnswers: !!b.showAnswers,
      showAnalysis: !!b.showAnalysis,
      passScore: Math.max(0, b.passScore ?? 60),
      status: '未开始',
      createdAt: this.now(),
    };
    this.exams.unshift(rec);
    return rec;
  }

  updateExam(
    id: string,
    b: Partial<
      Pick<
        Exam,
        | 'title'
        | 'courseId'
        | 'shuffle'
        | 'showScore'
        | 'showAnswers'
        | 'showAnalysis'
        | 'passScore'
      >
    >,
  ) {
    const idx = this.exams.findIndex((e) => e.id === id);
    if (idx === -1) throw new BadRequestException('exam not found');
    this.exams[idx] = { ...this.exams[idx], ...b };
    return this.exams[idx];
  }

  setExamStatus(id: string, status: Exam['status']) {
    const idx = this.exams.findIndex((e) => e.id === id);
    if (idx === -1) throw new BadRequestException('exam not found');
    this.exams[idx].status = status;
    return this.exams[idx];
  }

  deleteExam(id: string) {
    const before = this.exams.length;
    this.exams = this.exams.filter((e) => e.id !== id);
    return { ok: this.exams.length < before };
  }

  // Questions
  listQuestions(examId: string) {
    return this.questions.filter((q) => q.examId === examId);
  }
  addQuestion(b: {
    examId: string;
    type: QuestionType;
    stem: string;
    options?: { key: string; text: string }[];
    answer: string[];
    analysis?: string;
    score?: number;
  }) {
    if (!b?.examId || !b?.type || !b?.stem)
      throw new BadRequestException('examId/type/stem required');
    if ((b.type === 'single' || b.type === 'multiple') && (!b.options || b.options.length === 0))
      throw new BadRequestException('options required');
    if (!Array.isArray(b.answer) || b.answer.length === 0)
      throw new BadRequestException('answer required');
    const rec: Question = {
      id: this.id('Q'),
      examId: b.examId,
      type: b.type,
      stem: b.stem,
      options: b.options,
      answer: b.answer,
      analysis: b.analysis,
      score: b.score ?? 5,
    };
    this.questions.push(rec);
    return rec;
  }

  updateQuestion(
    id: string,
    b: Partial<Pick<Question, 'type' | 'stem' | 'options' | 'answer' | 'analysis' | 'score'>>,
  ) {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new BadRequestException('question not found');
    this.questions[idx] = { ...this.questions[idx], ...b } as Question;
    return this.questions[idx];
  }

  deleteQuestion(id: string) {
    const before = this.questions.length;
    this.questions = this.questions.filter((q) => q.id !== id);
    return { ok: this.questions.length < before };
  }

  importQuestions(body: {
    examId: string;
    items: {
      type: QuestionType;
      stem: string;
      options?: { key: string; text: string }[];
      answer: string[];
      analysis?: string;
      score?: number;
    }[];
  }) {
    if (!body?.examId || !Array.isArray(body?.items))
      throw new BadRequestException('examId/items required');
    const created: Question[] = [];
    for (const it of body.items) {
      created.push(
        this.addQuestion({
          examId: body.examId,
          type: it.type,
          stem: it.stem,
          options: it.options,
          answer: it.answer,
          analysis: it.analysis,
          score: it.score,
        }),
      );
    }
    return { count: created.length, items: created };
  }

  // Submissions with auto-grade
  submit(b: {
    examId: string;
    user: string;
    answers: Record<string, string[]>;
    schoolId?: string;
  }) {
    if (!b?.examId || !b?.user) throw new BadRequestException('examId/user required');
    const qs = this.listQuestions(b.examId);
    let score = 0;
    for (const q of qs) {
      const sel = (b.answers[q.id] || []).slice().sort();
      const ans = q.answer.slice().sort();
      const correct = sel.length === ans.length && sel.every((v, i) => v === ans[i]);
      if (correct) score += q.score;
    }
    const exam = this.exams.find((e) => e.id === b.examId);
    const passScore = exam?.passScore ?? 60;
    const passed = score >= passScore;
    const rec: Submission = {
      id: this.id('RES'),
      examId: b.examId,
      schoolId: b.schoolId || exam?.schoolId || 'sch-001',
      user: b.user,
      answers: b.answers,
      score,
      passed,
      submittedAt: this.now(),
    };
    this.submissions.unshift(rec);
    return rec;
  }
  listResults(params?: { examId?: string; user?: string; schoolId?: string }) {
    let arr = this.submissions.slice();
    if (params?.examId) arr = arr.filter((s) => s.examId === params.examId);
    if (params?.user) arr = arr.filter((s) => s.user.includes(params.user!));
    if (params?.schoolId) arr = arr.filter((s) => s.schoolId === params.schoolId);
    return arr;
  }

  // Notifications (simulated)
  notify(b: { examId: string; channel: 'sms' | 'app' | 'email'; to: string }) {
    if (!b?.examId || !b?.channel || !b?.to)
      throw new BadRequestException('examId/channel/to required');
    const rec: Notification = {
      id: this.id('NTF'),
      examId: b.examId,
      channel: b.channel,
      to: b.to,
      sentAt: this.now(),
    };
    this.notifications.unshift(rec);
    return rec;
  }
  listNotifications(params?: { examId?: string }) {
    const eid = params?.examId;
    return eid ? this.notifications.filter((n) => n.examId === eid) : this.notifications;
  }


}
