"use client";

import { useState } from "react";
import {
  type FamilyMember,
  type HomeProfile,
  type Profile,
  type RoutineProfile,
} from "@/lib/profile";
import {
  AGE_BANDS,
  CLEANING_FREQUENCIES,
  CLEANING_METHODS,
  CONDITIONS,
  COOKING_FUELS,
  COOKING_TIMES,
  COOLING,
  COMMUTES,
  EXERCISE,
  HOME_TYPES,
  INDOOR_SMOKE,
  PURIFIERS,
  RELATIONS,
  SEVERITIES,
  WINDOW_STATES,
  WORK,
} from "@/lib/profile-options";
import { citiesFor } from "@/lib/states";
import { cn } from "@/lib/ui";
import { LocationSelect } from "./location-picker";

type Props = {
  profile: Profile;
  onSave: (next: Profile) => void;
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `member-${Date.now()}`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      {hint ? <p className="mt-0.5 text-[10px] leading-4 text-muted">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition",
        active
          ? "bg-ink text-white ring-ink"
          : "bg-paper text-ink ring-line hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Option
          key={option}
          active={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </Option>
      ))}
    </div>
  );
}

function MultiChips({
  options,
  values,
  onChange,
  noneLabel,
}: {
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  /** When set, this option is exclusive and represents an empty selection. */
  noneLabel?: string;
}) {
  function toggle(option: string) {
    if (noneLabel && option === noneLabel) {
      onChange([]);
      return;
    }
    const base = noneLabel ? values.filter((v) => v !== noneLabel) : values;
    const next = base.includes(option)
      ? base.filter((v) => v !== option)
      : [...base, option];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isNone = Boolean(noneLabel && option === noneLabel);
        const active = isNone ? values.length === 0 : values.includes(option);
        return (
          <Option key={option} active={active} onClick={() => toggle(option)}>
            {option}
          </Option>
        );
      })}
    </div>
  );
}

function MemberEditor({
  member,
  index,
  total,
  onChange,
  onRemove,
}: {
  member: FamilyMember;
  index: number;
  total: number;
  onChange: (patch: Partial<FamilyMember>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
          Person {index + 1}
        </span>
        {total > 1 ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-medium text-muted hover:text-red-700"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <select
          value={member.relation}
          onChange={(e) => onChange({ relation: e.target.value })}
          aria-label="Relation"
          className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none"
        >
          {RELATIONS.map((relation) => (
            <option key={relation}>{relation}</option>
          ))}
        </select>
        <select
          value={member.ageBand}
          onChange={(e) => onChange({ ageBand: e.target.value })}
          aria-label="Age group"
          className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none"
        >
          {AGE_BANDS.map((band) => (
            <option key={band}>{band}</option>
          ))}
        </select>
      </div>

      <div className="mt-2">
        <div className="text-[10px] text-muted">Conditions</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {CONDITIONS.map((condition) => {
            const active = member.conditions.includes(condition);
            return (
              <Option
                key={condition}
                active={active}
                onClick={() =>
                  onChange({
                    conditions: active
                      ? member.conditions.filter((c) => c !== condition)
                      : [...member.conditions, condition],
                    severity:
                      active && member.conditions.length === 1
                        ? "None"
                        : member.severity,
                  })
                }
              >
                {condition}
              </Option>
            );
          })}
        </div>
      </div>

      {member.conditions.length ? (
        <div className="mt-2">
          <div className="text-[10px] text-muted">How serious?</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {SEVERITIES.map((severity) => (
              <Option
                key={severity}
                active={member.severity === severity}
                onClick={() =>
                  onChange({ severity: severity as FamilyMember["severity"] })
                }
              >
                {severity}
              </Option>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileEditor({ profile, onSave }: Props) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [synced, setSynced] = useState<Profile>(profile);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  // Re-sync when the saved profile changes (save, guided setup, or another tab).
  if (synced !== profile) {
    setSynced(profile);
    setDraft(profile);
  }

  function setHome(patch: Partial<HomeProfile>) {
    setDraft((current) => ({
      ...current,
      home: { ...current.home, ...patch },
    }));
  }

  function setRoutine(patch: Partial<RoutineProfile>) {
    setDraft((current) => ({
      ...current,
      routine: { ...current.routine, ...patch },
    }));
  }

  function addMember(relation: string) {
    setDraft((current) => ({
      ...current,
      family: [
        ...current.family,
        {
          id: uid(),
          relation,
          ageBand: "30-44",
          conditions: [],
          severity: "None",
        },
      ],
    }));
  }

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    setDraft((current) => ({
      ...current,
      family: current.family.map((member) =>
        member.id === id ? { ...member, ...patch } : member,
      ),
    }));
  }

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Your setup</h3>
          <p className="mt-0.5 text-[11px] leading-5 text-muted">
            Change anything here. It saves without the long setup flow.
          </p>
        </div>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => onSave(draft)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition",
            dirty
              ? "bg-ink text-white ring-ink"
              : "bg-paper text-muted ring-line",
          )}
        >
          {dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      <details className="mt-4 border-t border-line pt-3" open>
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          Location
        </summary>
        <div className="mt-2">
          <LocationSelect
            code={draft.location.stateCode}
            onStateChange={(stateCode) => {
              const city = citiesFor(stateCode)[0];
              setDraft((current) => ({
                ...current,
                location: {
                  stateCode,
                  city: city.name,
                  lat: city.lat,
                  lon: city.lon,
                },
              }));
            }}
            onSelectLocation={(location) =>
              setDraft((current) => ({ ...current, location }))
            }
          />
          <p className="mt-1 text-[10px] text-muted">
            Watching {draft.location.city}, {draft.location.stateCode}
          </p>
        </div>
      </details>

      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          Family ({draft.family.length})
        </summary>
        <div className="mt-2 space-y-2">
          {draft.family.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-3 text-center">
              <p className="text-[11px] leading-5 text-muted">
                No one added yet. Start with yourself.
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => addMember("You")}
                  className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  Add yourself
                </button>
                <button
                  type="button"
                  onClick={() => addMember("Other")}
                  className="rounded-full bg-paper px-3 py-1.5 text-[11px] font-medium text-ink ring-1 ring-line"
                >
                  Add someone
                </button>
              </div>
            </div>
          ) : null}
          {draft.family.map((member, index) => (
            <MemberEditor
              key={member.id}
              member={member}
              index={index}
              total={draft.family.length}
              onChange={(patch) => updateMember(member.id, patch)}
              onRemove={() =>
                setDraft((current) => ({
                  ...current,
                  family: current.family.filter((m) => m.id !== member.id),
                }))
              }
            />
          ))}
          {draft.family.length < 5 ? (
            <button
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  family: [
                    ...current.family,
                    {
                      id: uid(),
                      relation: "Other",
                      ageBand: "30-44",
                      conditions: [],
                      severity: "None",
                    },
                  ],
                }))
              }
              className="w-full rounded-xl border border-dashed border-line px-3 py-2 text-[11px] font-medium text-muted hover:bg-paper"
            >
              + Add another person
            </button>
          ) : null}
        </div>
      </details>

      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          Home
        </summary>
        <div className="mt-1">
          <Field label="Home type">
            <Chips
              options={HOME_TYPES}
              value={draft.home.type}
              onChange={(type) => setHome({ type })}
            />
          </Field>
          <Field label="Cooking" hint="Select all that apply. None clears the rest.">
            <MultiChips
              options={COOKING_FUELS}
              values={draft.home.cooking}
              noneLabel="None"
              onChange={(cooking) => setHome({ cooking })}
            />
          </Field>
          <Field label="Windows">
            <Chips
              options={WINDOW_STATES}
              value={draft.home.windows}
              onChange={(windows) => setHome({ windows })}
            />
          </Field>
          <Field label="Cooling" hint="Select all that apply.">
            <MultiChips
              options={COOLING}
              values={draft.home.cooling}
              noneLabel="None"
              onChange={(cooling) => setHome({ cooling })}
            />
          </Field>
          <Field label="Air purifier">
            <Chips
              options={PURIFIERS}
              value={draft.home.purifiers}
              onChange={(purifiers) => setHome({ purifiers })}
            />
          </Field>
          <Field label="Indoor smoke">
            <MultiChips
              options={INDOOR_SMOKE}
              values={draft.home.indoorSmoke}
              onChange={(indoorSmoke) => setHome({ indoorSmoke })}
            />
          </Field>
          <Field label="Cleaning methods">
            <MultiChips
              options={CLEANING_METHODS}
              values={draft.home.cleaning}
              onChange={(cleaning) => setHome({ cleaning })}
            />
          </Field>
          <Field label="How often?">
            <Chips
              options={CLEANING_FREQUENCIES}
              value={draft.home.cleaningFrequency}
              onChange={(cleaningFrequency) => setHome({ cleaningFrequency })}
            />
          </Field>
          <Field label="Also at home">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["Pets", "pets"],
                  ["Indoor plants", "plants"],
                  ["Carpet", "carpet"],
                  ["Dampness/mold", "damp"],
                ] as const
              ).map(([label, key]) => (
                <Option
                  key={key}
                  active={draft.home[key]}
                  onClick={() => setHome({ [key]: !draft.home[key] })}
                >
                  {label}
                </Option>
              ))}
            </div>
          </Field>
        </div>
      </details>

      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          Routine
        </summary>
        <div className="mt-1">
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-muted">Wake</div>
              <select
                value={draft.routine.wake}
                onChange={(e) => setRoutine({ wake: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none"
              >
                {["4:00 AM", "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-muted">Sleep</div>
              <select
                value={draft.routine.sleep}
                onChange={(e) => setRoutine({ sleep: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none"
              >
                {["8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM", "1:00 AM"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </div>
          </div>

          <Field label="Work">
            <Chips
              options={WORK}
              value={draft.routine.work}
              onChange={(work) => setRoutine({ work })}
            />
          </Field>

          <Field
            label="Commute"
            hint="Pick every mode you use. Two or more is a mixed commute."
          >
            <MultiChips
              options={COMMUTES}
              values={draft.routine.commute}
              onChange={(commute) => setRoutine({ commute })}
            />
          </Field>

          <Field label="Outdoor exercise">
            <Chips
              options={EXERCISE}
              value={draft.routine.exercise}
              onChange={(exercise) => setRoutine({ exercise })}
            />
          </Field>

          <Field label="Cooking times">
            <MultiChips
              options={COOKING_TIMES}
              values={draft.routine.cookingTimes}
              onChange={(cookingTimes) => setRoutine({ cookingTimes })}
            />
          </Field>
        </div>
      </details>

      {dirty ? (
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="mt-4 w-full rounded-xl bg-brand px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a4a3e]"
        >
          Save changes
        </button>
      ) : null}
    </div>
  );
}
