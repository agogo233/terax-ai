import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/modules/settings/preferences";
import type { ThemePref } from "@/modules/settings/store";
import {
  EDITOR_THEME_LABELS,
  EDITOR_THEMES,
  TERMINAL_FONT_SIZES,
  TERMINAL_SCROLLBACK_PRESETS,
  setAutostart,
  setEditorTheme,
  setRestoreWindowState,
  setTerminalFontSize,
  setTerminalScrollback,
  setTerminalWebglEnabled,
  setVimMode,
  type EditorThemeId,
} from "@/modules/settings/store";
import { useTheme } from "@/modules/theme";
import {
  ArrowDown01Icon,
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { SettingRow } from "../components/SettingRow";

const APPEARANCE: {
  id: ThemePref;
  label: string;
  icon: typeof ComputerIcon;
}[] = [
  { id: "system", label: "系统", icon: ComputerIcon },
  { id: "light", label: "浅色", icon: Sun03Icon },
  { id: "dark", label: "深色", icon: Moon02Icon },
];

export function GeneralSection() {
  const { theme, setTheme } = useTheme();
  const editorTheme = usePreferencesStore((s) => s.editorTheme);
  const autostart = usePreferencesStore((s) => s.autostart);
  const restoreWindowState = usePreferencesStore((s) => s.restoreWindowState);
  const vimMode = usePreferencesStore((s) => s.vimMode);
  const terminalWebglEnabled = usePreferencesStore(
    (s) => s.terminalWebglEnabled,
  );
  const terminalFontSize = usePreferencesStore((s) => s.terminalFontSize);
  const terminalScrollback = usePreferencesStore((s) => s.terminalScrollback);

  // Reconcile autostart pref with the actual OS state on mount — the user may
  // have toggled it from System Settings.
  useEffect(() => {
    let alive = true;
    void isEnabled()
      .then((on) => {
        if (!alive) return;
        if (on !== usePreferencesStore.getState().autostart) {
          void setAutostart(on);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const onToggleAutostart = async (next: boolean) => {
    try {
      if (next) await enable();
      else await disable();
      await setAutostart(next);
    } catch (e) {
      console.error("autostart toggle failed", e);
    }
  };

  const onPickEditor = (id: EditorThemeId) => void setEditorTheme(id);

  const onToggleTerminalWebgl = (next: boolean) => {
    void setTerminalWebglEnabled(next).catch((e) =>
      console.error("terminal WebGL preference update failed", e),
    );
  };

  const onPickTerminalFontSize = (size: number) => void setTerminalFontSize(size);

  const onPickScrollback = (lines: number) => void setTerminalScrollback(lines);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="通用"
        description="外观、编辑器和启动设置。"
      />

      <div className="flex flex-col gap-2">
        <Label>外观</Label>
        <div className="grid grid-cols-3 gap-2">
          {APPEARANCE.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setTheme(o.id)}
              className={cn(
                "group flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border bg-card transition-all",
                theme === o.id
                  ? "border-foreground/60 ring-1 ring-foreground/20"
                  : "border-border/60 hover:border-border",
              )}
            >
              <HugeiconsIcon icon={o.icon} size={18} strokeWidth={1.5} />
              <span className="text-[11.5px]">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>编辑器主题</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 justify-between gap-2 px-2.5 text-[12px]"
            >
              <span>{EDITOR_THEME_LABELS[editorTheme]}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={12}
                strokeWidth={2}
                className="opacity-70"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            {EDITOR_THEMES.map((t) => (
              <DropdownMenuItem
                key={t}
                onSelect={() => onPickEditor(t)}
                className={cn(
                  "text-[12px]",
                  t === editorTheme && "bg-accent/50",
                )}
              >
                {EDITOR_THEME_LABELS[t]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingRow
          title="Vim 模式"
          description="在代码编辑器中启用 Vim 键绑定。"
        >
          <Switch
            checked={vimMode}
            onCheckedChange={(v) => void setVimMode(v)}
          />
        </SettingRow>
      </div>

        <div className="flex flex-col gap-2">
          <Label>启动</Label>
          <SettingRow
            title="登录时启动"
            description="登录时自动打开 Terax。"
          >
            <Switch
              checked={autostart}
              onCheckedChange={(v) => void onToggleAutostart(v)}
            />
          </SettingRow>
          <SettingRow
            title="恢复窗口位置和大小"
            description="重新打开主窗口时恢复到上次关闭时的位置。下次启动时生效。"
          >
            <Switch
              checked={restoreWindowState}
              onCheckedChange={(v) => void setRestoreWindowState(v)}
            />
          </SettingRow>
        </div>

      <div className="flex flex-col gap-2">
        <Label>终端</Label>
        <SettingRow
          title={
            <span className="inline-flex items-center gap-1.5">
              使用 WebGL 渲染器
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="cursor-help text-[11px] text-muted-foreground/70 leading-none"
                      aria-label="More info about WebGL renderer"
                    >
                      ⓘ
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-[11px]">
                    xterm 的 WebGL 渲染器将字形缓存到 GPU 纹理图集中。在某些 macOS 设置上（尤其是使用 Nerd Fonts 时），图集会损坏导致终端文本无法阅读。关闭此选项作为备用方案——性能会略有下降，但文本会通过 DOM 渲染器正确渲染。
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          }
          description="硬件加速渲染。如果文本显示损坏或空白块，请关闭此选项。"
        >
          <Switch
            checked={terminalWebglEnabled}
            onCheckedChange={onToggleTerminalWebgl}
          />
        </SettingRow>
        <SettingRow
          title="字体大小"
          description="终端文本大小。"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 justify-between gap-2 rounded-none px-2.5 text-[12px]"
              >
                <span>{terminalFontSize} px</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  strokeWidth={2}
                  className="opacity-70"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[80px] rounded-none border border-border bg-popover p-0 shadow-none ring-0"
            >
              {TERMINAL_FONT_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onSelect={() => onPickTerminalFontSize(size)}
                  className={cn(
                    "rounded-none px-3 py-1.5 text-[12px]",
                    size === terminalFontSize && "bg-accent/50",
                  )}
                >
                  {size} px
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingRow>
        <SettingRow
          title="回滚行数"
          description="每个终端保留的历史行数。设置越高占用越多内存（约 3 KB/行）。"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 justify-between gap-2 rounded-none px-2.5 text-[12px]"
              >
                <span>{terminalScrollback.toLocaleString()} lines</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  strokeWidth={2}
                  className="opacity-70"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[140px] rounded-none border border-border bg-popover p-0 shadow-none ring-0"
            >
              {TERMINAL_SCROLLBACK_PRESETS.map((lines) => (
                <DropdownMenuItem
                  key={lines}
                  onSelect={() => onPickScrollback(lines)}
                  className={cn(
                    "rounded-none px-3 py-1.5 text-[12px]",
                    lines === terminalScrollback && "bg-accent/50",
                  )}
                >
                  {lines.toLocaleString()} lines
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingRow>
      </div>

      <div className="flex flex-col gap-2">
        <Label>启动</Label>
        <div className="flex flex-col gap-2">
          <SettingRow
            title="登录时启动"
            description="登录时自动打开 Terax。"
          >
            <Switch
              checked={autostart}
              onCheckedChange={(v) => void onToggleAutostart(v)}
            />
          </SettingRow>
          <SettingRow
            title="恢复窗口位置和大小"
            description="重新打开主窗口时恢复到上次关闭时的位置。下次启动时生效。"
          >
            <Switch
              checked={restoreWindowState}
              onCheckedChange={(v) => void setRestoreWindowState(v)}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-tight text-muted-foreground">
      {children}
    </span>
  );
}
