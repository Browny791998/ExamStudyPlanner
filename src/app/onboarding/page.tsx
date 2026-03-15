"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudyPlanSchema, type CreateStudyPlanFormData } from "@/validations/studyPlanSchema";
import { EXAM_TYPES, type ExamTypeKey } from "@/constants/examTypes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createStudyPlan, selectIsGenerating, selectStudyPlanError } from "@/store/slices/studyPlanSlice";
import { selectUser, patchUser } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CalendarIcon, ChevronLeft, ChevronRight, GraduationCap, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STEPS = ["Choose Exam", "Set Your Goal", "Confirm & Generate"];

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();
  const isGenerating = useAppSelector(selectIsGenerating);
  const serverError = useAppSelector(selectStudyPlanError);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin');
    // Don't redirect away if user already has plans — they may be adding a new one
  }, [user, router]);

  const [step, setStep] = useState(0);
  const [calOpen, setCalOpen] = useState(false);

  const minDate = addDays(new Date(), 30);

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CreateStudyPlanFormData>({
    resolver: zodResolver(createStudyPlanSchema),
    defaultValues: { examType: undefined, targetScore: "", examDate: "" },
  });

  const examType = watch("examType") as ExamTypeKey | undefined;
  const targetScore = watch("targetScore");
  const examDate = watch("examDate");

  const examConfig = examType ? EXAM_TYPES[examType] : null;

  const handleNext = async () => {
    let valid = false;
    if (step === 0) valid = await trigger("examType");
    if (step === 1) valid = await trigger(["targetScore", "examDate"]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: CreateStudyPlanFormData) => {
    const result = await dispatch(createStudyPlan(data));
    if (createStudyPlan.fulfilled.match(result)) {
      dispatch(patchUser({ hasCompletedOnboarding: true }));
      qc.invalidateQueries({ queryKey: ['study-plan'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['daily-tasks'] });
      router.push("/study-plan");
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">Exam Study Planner</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-bold mb-1">{STEPS[step]}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 0 && "Select the exam you're preparing for."}
          {step === 1 && "Tell us your target score and exam date."}
          {step === 2 && "Review your plan before we generate it."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 0 — Choose Exam */}
          {step === 0 && (
            <Controller
              control={control}
              name="examType"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(EXAM_TYPES) as ExamTypeKey[]).map((key) => {
                    const exam = EXAM_TYPES[key];
                    const selected = field.value === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          field.onChange(key);
                          setValue("targetScore", "");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all text-center",
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-3xl">{exam.icon}</span>
                        <span className="font-semibold text-sm">{exam.label}</span>
                        <span className="text-xs text-muted-foreground">{exam.description}</span>
                      </button>
                    );
                  })}
                  {errors.examType && (
                    <p className="col-span-2 text-xs text-destructive">{errors.examType.message}</p>
                  )}
                </div>
              )}
            />
          )}

          {/* STEP 1 — Target score + Exam date */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Target Score */}
              <div className="space-y-1.5">
                <Label>{examConfig?.scoreLabel ?? "Target Score"}</Label>
                <Controller
                  control={control}
                  name="targetScore"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={cn(errors.targetScore && "border-destructive")}>
                        <SelectValue placeholder="Select your target score" />
                      </SelectTrigger>
                      <SelectContent>
                        {(examConfig?.scoreOptions ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetScore && (
                  <p className="text-xs text-destructive">{errors.targetScore.message}</p>
                )}
              </div>

              {/* Exam Date */}
              <div className="space-y-1.5">
                <Label>Exam Date</Label>
                <Controller
                  control={control}
                  name="examDate"
                  render={({ field }) => (
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors",
                          !field.value && "text-muted-foreground",
                          errors.examDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => {
                            if (d) {
                              field.onChange(d.toISOString());
                              setCalOpen(false);
                            }
                          }}
                          disabled={(d) => d < minDate}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.examDate && (
                  <p className="text-xs text-destructive">{errors.examDate.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Must be at least 30 days from today.</p>
              </div>
            </div>
          )}

          {/* STEP 2 — Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-2xl bg-muted/50 border border-border p-4 space-y-3">
                {[
                  { label: "Exam", value: examType ? EXAM_TYPES[examType].label : "" },
                  { label: "Target Score", value: targetScore },
                  { label: "Exam Date", value: examDate ? format(new Date(examDate), "PPP") : "" },
                  { label: "Start Date", value: format(new Date(), "PPP") },
                  { label: "Plan Duration", value: "90 days" },
                  { label: "Total Sessions", value: "~90 study sessions" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Generating your personalized 90-day plan…
                  </p>
                  <Progress value={0} className="animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-3">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={isGenerating}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isGenerating} className="ml-auto">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate My Study Plan"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
