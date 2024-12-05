import { AnyBlock } from "@slack/types";
import { plainText, section } from "@slack-building-blocks";
import { OrganizationSettingsProvider } from "../../api-adapters/organization-settings/OrganizationSettingsProvider";

export async function saveOrganizationSettings({ ack, body, view }: any) {
    const respond = async (title: string, ...blocks: AnyBlock[]): Promise<void> => {
        await ack({
            response_action: "update",
            view: {
                type: "modal",
                title: plainText(title),
                blocks: blocks
            }
        });
    };

    const organizationId = view.callback_id.split("-")[1];
    const updatedValues = Object.values(body.view.state.values).flatMap(block => Object.entries(block))
        .reduce((accumulator: any, fieldEntry: any) => {
            accumulator[fieldEntry[0]] = fieldEntry[1].selected_users || fieldEntry[1].selected_channel || null;
            return accumulator;
        }, {});
    await OrganizationSettingsProvider.update(body.team.id, organizationId, updatedValues);
    await respond("Success", section(":thumbsup: Organization settings updated successfully."));
}