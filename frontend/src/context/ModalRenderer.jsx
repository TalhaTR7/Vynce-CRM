import { useModal } from "./ModalContext";
import ModalPortal from "./ModalPortal";
import { CreateProject } from "../components/modals/CreateProject";
import { CreateBoard } from "../components/modals/CreateBoard";
import { CreateTask, RestoreTask } from "../components/modals/CreateTask";
import { SetBounty, SetDifficulty } from "../components/modals/Popovers";
import { CloseTask, DeleteAccount, DeleteMails, DeleteTask, DeleteTasks, FindUser, InvitationResponse, InviteUser, LeaveProject, Logout, OwnershipResponse, RemoveMembers, ReturnTask, SubmitTask, TransferOwnership, UpdatePassword } from "../components/modals/Dialogues";


function ModalRenderer() {
    const { modal, closeModal } = useModal();

    return (
        <ModalPortal>
            {modal?.type === "CREATE_PROJECT" && (<CreateProject onClose={closeModal} />)}
            {modal?.type === "CREATE_BOARD" && (<CreateBoard onClose={closeModal} project={modal.payload.project} />)}
            {modal?.type === "CREATE_TASK" && (<CreateTask onClose={closeModal} project={modal.payload.project} board={modal.payload.board} />)}
            {modal?.type === "SET_BOUNTY" && (<SetBounty onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "SET_DIFFICULTY" && (<SetDifficulty onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "REMOVE_MEMBERS" && (<RemoveMembers onClose={closeModal} memberIds={modal.payload.memberIds} />)}
            {modal?.type === "CLOSE_TASK" && (<CloseTask onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "DELETE_TASK" && (<DeleteTask onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "SUBMIT_TASK" && (<SubmitTask onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "RETURN_TASK" && (<ReturnTask onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "RESTORE_TASK" && (<RestoreTask onClose={closeModal} task={modal.payload.task} />)}
            {modal?.type === "ARCHIVE_CLEANUP" && (<DeleteTasks onClose={closeModal} taskIds={modal.payload.taskIds} projectId={modal.payload.projectId} />)}
            {modal?.type === "DELETE_MAILS" && (<DeleteMails onClose={closeModal} selected={modal.payload.selected} />)}
            {modal?.type === "LOGOUT" && (<Logout onClose={closeModal} />)}
            {modal?.type === "CHANGE_PASSWORD" && (<UpdatePassword onClose={closeModal} />)}
            {modal?.type === "DELETE_ACCOUNT" && (<DeleteAccount onClose={closeModal} user={modal.payload.user} />)}
            {modal?.type === "FIND_USER" && (<FindUser onClose={closeModal} />)}
            {modal?.type === "INVITE_USER" && (<InviteUser onClose={closeModal} projectId={modal.payload.projectId} />)}
            {modal?.type === "INVITE_RESPONSE" && (<InvitationResponse onClose={closeModal} payload={modal.payload.payload} />)}
            {modal?.type === "LEAVE_PROJECT" && (<LeaveProject onClose={closeModal} project={modal.payload.project} />)}
            {modal?.type === "TRANSFER_OWNERSHIP" && (<TransferOwnership onClose={closeModal} payload={modal.payload.payload} />)}
            {modal?.type === "OWNERSHIP_RESPONSE" && (<OwnershipResponse onClose={closeModal} payload={modal.payload.payload} />)}
        </ModalPortal>
    );
}

export default ModalRenderer;