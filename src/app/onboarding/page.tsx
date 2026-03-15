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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle, CalendarIcon, ChevronLeft, ChevronRight,
  GraduationCap, Loader2, PenLine,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STANDARD_STEPS = ["Choose Exam", "Set Your Goal", "Confirm & Generate"];
const CUSTOM_STEPS   = ["Choose Exam", "Exam Details", "Plan Duration", "Confirm & Generate"];

const DAY_PRESETS = [7, 14, 30, 60, 90, 180];

type StandardForm = Extract<CreateStudyPlanFormData, { planMode: "standard" }>;
type CustomForm   = Extract<CreateStudyPlanFormData, { planMode: "custom" }>;

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();
  const isGenerating = useAppSelector(selectIsGenerating);
  const serverError = useAppSelector(selectStudyPlanError);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (user?.role === "admin") router.replace("/admin");
  }, [user, router]);

  const [step, setStep] = useState(0);
  const [calOpen, setCalOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("");

  const minDate = addDays(new Date(), 30);
  const steps = isCustom ? CUSTOM_STEPS : STANDARD_STEPS;

  const standardForm = useForm<StandardForm>({
    resolver: zodResolver(createStudyPlanSchema.options[0]),
    defaultValues: { planMode: "standard", examType: undefined, targetScore: "", examDate: "" },
  });

  const customForm = useForm<CustomForm>({
    resolver: zodResolver(createStudyPlanSchema.options[1]),
    defaultValues: {
      planMode: "custom",
      examType: "CUSTOM",
      customExamName: "",
      targetScore: "",
      planDays: 30,
      examDate: "",
    },
  });

  const examType      = standardForm.watch("examType") as ExamTypeKey | undefined;
  const targetScore   = standardForm.watch("targetScore");
  const examDate      = standardForm.watch("examDate");
  const customExamName    = customForm.watch("customExamName");
  const customTargetScore = customForm.watch("targetScore");
  const planDays          = customForm.watch("planDays");
  const customExamDate    = customForm.watch("examDate");

  const examConfig = examType ? EXAM_TYPES[examType] : null;

  const handleNext = async () => {
    let valid = false;
    if (isCustom) {
      if (step === 0) valid = true;
      if (step === 1) valid = await customForm.trigger(["customExamName", "targetScore"]);
      if (step === 2) valid = await customForm.trigger(["planDays"]);
    } else {
      if (step === 0) valid = await standardForm.trigger("examType");
      if (step === 1) valid = await standardForm.trigger(["targetScore", "examDate"]);
    }
    if (valid) setStep((s) => s + 1);
  };

  const onSubmitStandard = async (data: StandardForm) => {
    const result = await dispatch(createStudyPlan(data));
    if (createStudyPlan.fulfilled.match(result)) {
      dispatch(patchUser({ hasCompletedOnboarding: true }));
      qc.invalidateQueries({ queryKey: ["study-plan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["daily-tasks"] });
      router.push("/study-plan");
    }
  };

  const onSubmitCustom = async (data: CustomForm) => {
    const result = await dispatch(createStudyPlan(data));
    if (createStudyPlan.fulfilled.match(result)) {
      dispatch(patchUser({ hasCompletedOnboarding: true }));
      qc.invalidateQueries({ queryKey: ["study-plan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/study-plan");
    }
  };

  const isLastStep = step === steps.length - 1;

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
        {steps.map((label, i) => (
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
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-8 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-bold mb-1">{steps[step]}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 0 && "Select the exam you're preparing for."}
          {isCustom && step === 1 && "Name your exam and set a goal."}
          {isCustom && step === 2 && "Choose how many days you want to study."}
          {isCustom && step === 3 && "Review your plan before we create it."}
          {!isCustom && step === 1 && "Tell us your target score and exam date."}
          {!isCustom && step === 2 && "Review your plan before we generate it."}
        </p>

        {/* STEP 0 — Choose exam */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(EXAM_TYPES) as ExamTypeKey[]).map((key) => {
                const exam = EXAM_TYPES[key];
                const selected = !isCustom && standardForm.watch("examType") === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      standardForm.setValue("examType", key);
                      standardForm.setValue("targetScore", "");
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

              {/* Custom exam card */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all text-center",
                  isCustom
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <PenLine className="h-8 w-8 text-muted-foreground" />
                <span className="font-semibold text-sm">Custom</span>
                <span className="text-xs text-muted-foreground">Any exam, your schedule</span>
              </button>
            </div>
            {standardForm.formState.errors.examType && !isCustom && (
              <p className="text-xs text-destructive">{standardForm.formState.errors.examType.message}</p>
            )}
          </div>
        )}

        {/* STANDARD STEP 1 — Target score + Exam date */}
        {!isCustom && step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>{examConfig?.scoreLabel ?? "Target Score"}</Label>
              <Controller
                control={standardForm.control}
                name="targetScore"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={cn(standardForm.formState.errors.targetScore && "border-destructive")}>
                      <SelectValue placeholder="Select your target score" />
                    </SelectTrigger>
                    <SelectContent>
                      {(examConfig?.scoreOptions ?? []).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {standardForm.formState.errors.targetScore && (
                <p className="text-xs text-destructive">{standardForm.formState.errors.targetScore.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Exam Date</Label>
              <Controller
                control={standardForm.control}
                name="examDate"
                render={({ field }) => (
                  <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors",
                        !field.value && "text-muted-foreground",
                        standardForm.formState.errors.examDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(d) => { if (d) { field.onChange(d.toISOString()); setCalOpen(false); } }}
                        disabled={(d) => d < minDate}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {standardForm.formState.errors.examDate && (
                <p className="text-xs text-destructive">{standardForm.formState.errors.examDate.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Must be at least 30 days from today.</p>
            </div>
          </div>
        )}

        {/* STANDARD STEP 2 — Confirm */}
        {!isCustom && step === 2 && (
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
                <p className="text-sm text-muted-foreground text-center">Generating your personalized 90-day plan…</p>
                <Progress value={0} className="animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* CUSTOM STEP 1 — Exam name + goal */}
        {isCustom && step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Exam / Subject Name *</Label>
              <Input
                placeholder="e.g. N3 Grammar Sprint, CFA Level 1, Bar Exam…"
                {...customForm.register("customExamName")}
                className={cn(customForm.formState.errors.customExamName && "border-destructive")}
              />
              {customForm.formState.errors.customExamName && (
                <p className="text-xs text-destructive">{customForm.formState.errors.customExamName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Your Goal *</Label>
              <Input
                placeholder="e.g. Pass, Score 80%, Finish all chapters…"
                {...customForm.register("targetScore")}
                className={cn(customForm.formState.errors.targetScore && "border-destructive")}
              />
              {customForm.formState.errors.targetScore && (
                <p className="text-xs text-destructive">{customForm.formState.errors.targetScore.message}</p>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM STEP 2 — Plan duration */}
        {isCustom && step === 2 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>How many days do you want to study?</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      customForm.setValue("planDays", d, { shouldValidate: true });
                      setCustomDaysInput(String(d));
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium border transition-colors",
                      planDays === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Or enter a custom number (1–365)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 45"
                    value={customDaysInput}
                    onChange={(e) => {
                      setCustomDaysInput(e.target.value);
                      const n = parseInt(e.target.value);
                      if (!isNaN(n)) {
                        customForm.setValue("planDays", n, { shouldValidate: true });
                      }
                    }}
                    className={cn("w-32", customForm.formState.errors.planDays && "border-destructive")}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                {customForm.formState.errors.planDays && (
                  <p className="text-xs text-destructive">{customForm.formState.errors.planDays.message}</p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <Label>Exam Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Controller
                  control={customForm.control}
                  name="examDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        {field.value ? format(new Date(field.value), "PPP") : "Pick a date (optional)"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => { if (d) field.onChange(d.toISOString()); }}
                          disabled={(d) => d < new Date()}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                <p className="text-xs text-muted-foreground">Helps track days remaining in the sidebar.</p>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM STEP 3 — Confirm */}
        {isCustom && step === 3 && (
          <div className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="rounded-2xl bg-muted/50 border border-border p-4 space-y-3">
              {[
                { label: "Exam / Subject", value: customExamName },
                { label: "Goal", value: customTargetScore },
                { label: "Start Date", value: format(new Date(), "PPP") },
                { label: "Plan Duration", value: `${planDays} day${planDays !== 1 ? "s" : ""}` },
                { label: "Exam Date", value: customExamDate ? format(new Date(customExamDate), "PPP") : "Not set" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground bg-primary/5 rounded-xl px-3 py-2 border border-primary/10">
              Your plan will be created with {planDays} empty day slots. Add your own study tasks from the Study Plan page.
            </p>
            {isGenerating && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">Creating your study plan…</p>
                <Progress value={0} className="animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={isGenerating}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}

          {!isLastStep ? (
            <Button type="button" onClick={handleNext} className="ml-auto">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isGenerating}
              className="ml-auto"
              onClick={() => {
                if (isCustom) {
                  customForm.handleSubmit(onSubmitCustom)();
                } else {
                  standardForm.handleSubmit(onSubmitStandard)();
                }
              }}
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                isCustom ? "Create My Study Plan" : "Generate My Study Plan"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
