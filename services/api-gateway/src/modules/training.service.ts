import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type QuestionType = 'single' | 'multiple' | 'boolean';

export type Course = { id: string; title: string; desc?: string; status: '进行中' | '已归档'; createdAt: string };
export type Exam = {
  id: string;
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
  user: string;
  answers: Record<string, string[]>; // qid -> selected
  score: number;
  passed: boolean;
  submittedAt: string;
};
export type Notification = { id: string; examId: string; channel: 'sms' | 'app' | 'email'; to: string; sentAt: string };

@Injectable()
export class TrainingService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();
  courses: Course[] = [];
  exams: Exam[] = [];
  questions: Question[] = [];
  submissions: Submission[] = [];
  notifications: Notification[] = [];

  constructor(){ this.seed(); }
  private id(p: string){ return `${p}-${String(this.seq++).padStart(4,'0')}`; }
  private now(){ return new Date().toISOString(); }
  stream(): Observable<MessageEvent> { setTimeout(()=>this.events$.next({ type:'hello', data:{ok:true}}),0); return this.events$.asObservable(); }

  // Courses
  listCourses(){ return this.courses; }
  createCourse(b: { title: string; desc?: string }){
    if (!b?.title) throw new BadRequestException('title required');
    const rec: Course = { id: this.id('CRS'), title: b.title, desc: b.desc, status: '进行中', createdAt: this.now() };
    this.courses.unshift(rec); return rec;
  }

  // Exams
  listExams(params?: { courseId?: string }){ const cid = params?.courseId; return cid ? this.exams.filter(e=>e.courseId===cid) : this.exams; }
  createExam(b: { title: string; courseId?: string; shuffle?: boolean; showScore?: boolean; showAnswers?: boolean; showAnalysis?: boolean; passScore?: number }){
    if (!b?.title) throw new BadRequestException('title required');
    const rec: Exam = {
      id: this.id('EX'),
      title: b.title,
      courseId: b.courseId,
      shuffle: !!b.shuffle,
      showScore: b.showScore ?? true,
      showAnswers: !!b.showAnswers,
      showAnalysis: !!b.showAnalysis,
      passScore: Math.max(0, b.passScore ?? 60),
      status: '未开始',
      createdAt: this.now(),
    };
    this.exams.unshift(rec); return rec;
  }

  // Questions
  listQuestions(examId: string){ return this.questions.filter(q=>q.examId===examId); }
  addQuestion(b: { examId: string; type: QuestionType; stem: string; options?: { key: string; text: string }[]; answer: string[]; analysis?: string; score?: number }){
    if (!b?.examId || !b?.type || !b?.stem) throw new BadRequestException('examId/type/stem required');
    if ((b.type==='single' || b.type==='multiple') && (!b.options || b.options.length===0)) throw new BadRequestException('options required');
    if (!Array.isArray(b.answer) || b.answer.length===0) throw new BadRequestException('answer required');
    const rec: Question = { id: this.id('Q'), examId: b.examId, type: b.type, stem: b.stem, options: b.options, answer: b.answer, analysis: b.analysis, score: b.score ?? 5 };
    this.questions.push(rec); return rec;
  }

  // Submissions with auto-grade
  submit(b: { examId: string; user: string; answers: Record<string, string[]> }){
    if (!b?.examId || !b?.user) throw new BadRequestException('examId/user required');
    const qs = this.listQuestions(b.examId);
    let score = 0;
    for (const q of qs){
      const sel = (b.answers[q.id] || []).slice().sort();
      const ans = q.answer.slice().sort();
      const correct = sel.length===ans.length && sel.every((v,i)=>v===ans[i]);
      if (correct) score += q.score;
    }
    const exam = this.exams.find(e=>e.id===b.examId);
    const passScore = exam?.passScore ?? 60;
    const passed = score >= passScore;
    const rec: Submission = { id: this.id('RES'), examId: b.examId, user: b.user, answers: b.answers, score, passed, submittedAt: this.now() };
    this.submissions.unshift(rec); return rec;
  }
  listResults(params?: { examId?: string }){ const eid = params?.examId; return eid ? this.submissions.filter(s=>s.examId===eid) : this.submissions; }

  // Notifications (simulated)
  notify(b: { examId: string; channel: 'sms'|'app'|'email'; to: string }){
    if (!b?.examId || !b?.channel || !b?.to) throw new BadRequestException('examId/channel/to required');
    const rec: Notification = { id: this.id('NTF'), examId: b.examId, channel: b.channel, to: b.to, sentAt: this.now() };
    this.notifications.unshift(rec); return rec;
  }
  listNotifications(params?: { examId?: string }){ const eid = params?.examId; return eid ? this.notifications.filter(n=>n.examId===eid) : this.notifications; }

  private seed(){
    const c = this.createCourse({ title: '后厨卫生规范', desc: '厨房卫生标准与流程' });
    const ex = this.createExam({ title: '卫生规范考试', courseId: c.id, shuffle: true, showScore: true, showAnswers: false, showAnalysis: true, passScore: 60 });
    this.addQuestion({ examId: ex.id, type: 'single', stem: '进入后厨应佩戴帽子吗？', options: [{key:'A',text:'是'},{key:'B',text:'否'}], answer: ['A'], analysis: '必须佩戴', score: 10 });
    this.addQuestion({ examId: ex.id, type: 'multiple', stem: '以下哪些属于不规范行为？', options: [{key:'A',text:'打电话'},{key:'B',text:'未戴口罩'},{key:'C',text:'未戴帽'},{key:'D',text:'规范操作'}], answer: ['A','B','C'], score: 15 });
    this.addQuestion({ examId: ex.id, type: 'boolean', stem: '操作台可随意放置私人物品。', answer: ['false'], score: 10 });
    this.submit({ examId: ex.id, user: '张三', answers: {} });
  }
}

