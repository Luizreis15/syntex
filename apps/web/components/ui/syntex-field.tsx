import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SyntexSelect, type SyntexSelectOption } from "./syntex-select";

/**
 * Larguras proporcionais ao conteúdo do dado, não à grade do formulário
 * (prompt 02.2: "CNPJ não ocupa a mesma largura que razão social"). `full`
 * é o default — só encolha quando o dado tem forma conhecida e fixa.
 */
const WIDTH: Record<"xs" | "sm" | "md" | "lg" | "full", string> = {
  xs: "basis-28 max-w-[7rem]", // UF, código curto
  sm: "basis-44 max-w-[11rem]", // CEP, telefone, data
  md: "basis-64 max-w-[16rem]", // CNPJ, e-mail, cidade
  lg: "basis-96 max-w-[24rem]", // nome de pessoa, logradouro
  full: "basis-full max-w-none",
};

interface FieldChromeProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  width?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

function FieldChrome({ label, required, hint, error, width = "full", className, children, htmlFor }: FieldChromeProps) {
  return (
    <div className={cn("flex flex-col gap-1", WIDTH[width], className)}>
      <label htmlFor={htmlFor} className="text-label uppercase text-ink-3">
        {label}
        {required && <span className="text-status-disputada"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-label text-danger">{error}</p>
      ) : hint ? (
        <p className="text-label text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "h-input w-full rounded-control border border-border bg-surface px-2.5 text-body text-ink outline-none placeholder:text-ink-3 transition-colors hover:border-border-strong focus-visible:border-petrol-600 disabled:bg-surface-2 disabled:text-ink-3";

type BaseFieldProps = Pick<FieldChromeProps, "label" | "required" | "hint" | "error" | "width" | "className">;

export interface SyntexFieldInputProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "width"> {
  variant: "input";
  mono?: boolean;
}

export interface SyntexFieldSelectProps extends BaseFieldProps {
  variant: "select";
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SyntexSelectOption[];
}

export interface SyntexFieldDisplayProps extends BaseFieldProps {
  variant: "display";
  children: ReactNode;
  mono?: boolean;
}

export type SyntexFieldProps = SyntexFieldInputProps | SyntexFieldSelectProps | SyntexFieldDisplayProps;

/**
 * Par label/dado único do produto — três modos do mesmo componente, nunca
 * três componentes (design/SYNTEX-UI.md §9). `display` é leitura (ficha de
 * entidade); `input` e `select` são captura (formulário). Nenhuma tela deve
 * montar `<input className="...">` local: se o dado não cabe em nenhum dos
 * três modos, falta um modo aqui, não uma exceção na tela.
 */
export const SyntexField = forwardRef<HTMLInputElement, SyntexFieldProps>(function SyntexField(props, ref) {
  const { label, required, hint, error, width, className } = props;

  if (props.variant === "select") {
    const { name, value, onValueChange, options } = props;
    return (
      <FieldChrome label={label} required={required} hint={hint} error={error} width={width} className={className}>
        <input type="hidden" name={name} value={value} readOnly />
        <SyntexSelect
          value={value}
          onValueChange={onValueChange}
          options={options}
          aria-label={label}
          className="w-full"
        />
      </FieldChrome>
    );
  }

  if (props.variant === "display") {
    const { children, mono } = props;
    return (
      <FieldChrome label={label} required={required} hint={hint} error={error} width={width} className={className}>
        <div className={cn("text-body text-ink", mono && "font-mono")}>{children}</div>
      </FieldChrome>
    );
  }

  const { variant: _variant, mono, id, name, ...inputProps } = props;
  const fieldId = id ?? name;
  return (
    <FieldChrome
      label={label}
      required={required}
      hint={hint}
      error={error}
      width={width}
      className={className}
      htmlFor={fieldId}
    >
      <input
        ref={ref}
        id={fieldId}
        name={name}
        required={required}
        className={cn(inputBase, mono && "font-mono")}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
    </FieldChrome>
  );
});
