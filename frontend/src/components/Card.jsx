// Card components: kanban Card, ArchivedCard, MarketCard (auction)
import styles from "../css/Card.module.scss";
import coin_svg from "../assets/icons/coin.svg";
import points_svg from "../assets/icons/points.svg";
import clock_svg from "../assets/icons/clock.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import comment_svg from "../assets/icons/comment.svg";
import archive_svg from "../assets/icons/archive.svg";
import { useDraggable } from "@dnd-kit/core";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";


/* ── Shared helper ───────────────────────────────────────────────── */
function getDueLabel(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: "today", type: "today" };
    if (diff < 0) return { label: "overdue", type: "overdue" };
    return { label: `${diff} day${diff > 1 ? "s" : ""}`, type: "normal" };
}

function DifficultyStars({ value, className }) {
    return (
        <div className={className}>
            {[...Array(5)].map((_, i) => (
                <img key={i} src={i < value ? difficultyOn_svg : difficultyOff_svg} />
            ))}
        </div>
    );
}


/* KANBAN CARD ══════════════════════════════════════════════════════ */
export function Card({ task, status = "…", isOverlay }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });

    const style = {
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? "none" : "auto",
        cursor: isOverlay ? "grabbing" : "grab",
        transform: isOverlay && transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
    };

    const due = getDueLabel(task?.dueDate);
    const motivation = task.worktime * 2;

    const duePillClass = [
        styles.cardDuePill,
        due?.type === "overdue" ? styles.cardDuePillOverdue : "",
        due?.type === "today" ? styles.cardDuePillToday : "",
    ].join(' ');

    return (
        <div
            className={styles.card}
            ref={setNodeRef}
            style={style}
            {...attributes}
            onPointerDown={(e) => {
                if (e.target.closest(`.${styles.cardTitle}`)) return;
                listeners.onPointerDown(e);
            }}
            onTouchStart={(e) => {
                if (e.target.closest(`.${styles.cardTitle}`)) return;
                listeners.onTouchStart(e);
            }}>
            {/* Info row */}
            <div className={styles.cardInfoRow}>
                <span className={styles.cardStatusPill}>{status}</span>
                {due && (
                    <div className={duePillClass}>
                        <img src={clock_svg} />
                        <p>{due.label}</p>
                    </div>
                )}
            </div>

            {/* Title — navigates to task, doesn't trigger drag */}
            <Link to={`/task/${task._id}`} className={styles.cardTitle}>
                {task.title}
            </Link>

            {/* Difficulty */}
            <DifficultyStars value={task.difficulty} className={styles.cardDifficulty} />

            {/* Footer */}
            <div className={styles.cardFooter}>
                <div className={styles.cardAssigneeRow}>
                    <div className={styles.cardAssigneeAvatar}>
                        <img src={task.assignee.profileImage.url} />
                    </div>
                    <div className={styles.cardStatBadge}>
                        <img src={coin_svg} />
                        <p>{task.ethereum.calculated}</p>
                    </div>
                    <div className={styles.cardStatBadge}>
                        <img src={points_svg} />
                        <p>{motivation}</p>
                    </div>
                </div>
                <div className={styles.cardCommentBadge}>
                    <img src={comment_svg} />
                    <p>{task.comments}</p>
                </div>
            </div>
        </div>
    );
}


/* ARCHIVED CARD ════════════════════════════════════════════════════ */
export function ArchivedCard({ task, onClick, isSelected }) {
    const { openModal } = useModal();
    const motivation = task.worktime * 2;

    return (
        <div
            className={`${styles.archivedCard} ${isSelected ? styles.archivedCardSelected : ""}`}
            onClick={onClick}
            onContextMenu={(e) => {
                openModal("RESTORE_TASK", { task });
                e.preventDefault();
            }}>
            {/* Project + comment count */}
            <div className={styles.archivedCardInfoRow}>
                <div className={styles.archivedCardProject}>
                    <div className={styles.archivedCardProjectThumbnail}>
                        <img src={task.project.projectImage.url} />
                    </div>
                    <p>{task.project.name}</p>
                </div>
                <div className={styles.archivedCardCommentBadge}>
                    <img src={comment_svg} />
                    <p>{task.comments}</p>
                </div>
            </div>

            {/* Title */}
            <h5 className={styles.archivedCardTitle}>{task.title}</h5>

            {/* Footer */}
            <div className={styles.archivedCardFooter}>
                <DifficultyStars value={task.difficulty} className={styles.archivedCardDifficulty} />
                <div className={styles.archivedCardMisc}>
                    <div className={styles.archivedCardStatBadge}>
                        <img src={coin_svg} />
                        <p>{task.ethereum.assigned}</p>
                    </div>
                    <div className={styles.archivedCardStatBadge}>
                        <img src={points_svg} />
                        <p>{motivation}</p>
                    </div>
                    <img src={archive_svg} className={styles.archivedCardArchiveIcon} />
                </div>
            </div>
        </div>
    );
}


/* AUCTIONED CARD ═══════════════════════════════════════════════════ */
export function MarketCard({ task, auction, onClick }) {
    const due = getDueLabel(task?.dueDate);
    const bidCount = auction?.bids?.length ?? 0;

    const highestBid = bidCount > 0
        ? Math.max(...auction.bids.map(b => b.amount))
        : null;
    const minBid = highestBid !== null ? highestBid + 1 : auction.baseReward;

    const duePillClass = [
        styles.marketCardDuePill,
        due?.type === "overdue" ? styles.marketCardDuePillOverdue : "",
        due?.type === "today" ? styles.marketCardDuePillToday : "",
    ].join(' ');

    return (
        <div className={styles.marketCard} onClick={onClick}>

            {/* Top row — project identity + due-in pill */}
            <div className={styles.marketCardTopRow}>
                <div className={styles.marketCardProject}>
                    <div className={styles.marketCardProjectAvatar}>
                        <img src={task.project.projectImage.url} />
                    </div>
                    <p>{task.project.name}</p>
                </div>
                {due && (
                    <div className={duePillClass}>
                        <img src={clock_svg} />
                        <p>{due.label}</p>
                    </div>
                )}
            </div>

            {/* Title */}
            <p className={styles.marketCardTitle}>{task.title}</p>

            {/* Footer stats: Difficulty | Base | Min | Bids */}
            <div className={styles.marketCardFooter}>

                <div className={styles.marketCardStat}>
                    <span className={styles.marketCardStatLabel}>Difficulty</span>
                    <div className={styles.marketCardStatValue}>
                        <div className={styles.marketCardDifficultyStars}>
                            {[...Array(5)].map((_, i) => (
                                <img key={i} src={i < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.marketCardStatDivider} />

                <div className={styles.marketCardStat}>
                    <span className={styles.marketCardStatLabel}>Base</span>
                    <div className={styles.marketCardStatValue}>
                        <img src={coin_svg} />
                        <p>{auction.baseReward}</p>
                    </div>
                </div>

                <div className={styles.marketCardStatDivider} />

                <div className={styles.marketCardStat}>
                    <span className={styles.marketCardStatLabel}>Min bid</span>
                    <div className={styles.marketCardStatValue}>
                        <img src={coin_svg} />
                        <p>{minBid}</p>
                    </div>
                </div>

                <div className={styles.marketCardStatDivider} />

                <div className={styles.marketCardStat}>
                    <span className={styles.marketCardStatLabel}>Bids</span>
                    <div className={styles.marketCardStatValue}>
                        <p>{bidCount}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Card;