import { Fragment, type ReactNode } from "react";

const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

export function renderWithBold(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  BOLD_PATTERN.lastIndex = 0;
  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = BOLD_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts;
}

const SMALL_PATTERN = /\*\*\*([^*]+)\*\*\*/g;

// 대학교 이름에 ***캠퍼스명*** 처럼 감싸면 그 부분만 60% 크기로 줄여서
// "본교***분교명***" 같은 표기를 한 줄에 자연스럽게 담을 수 있게 한다.
export function renderWithSmall(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  SMALL_PATTERN.lastIndex = 0;
  while ((match = SMALL_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    parts.push(
      <span key={key++} style={{ fontSize: "60%" }}>
        {match[1]}
      </span>,
    );
    lastIndex = SMALL_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts;
}
