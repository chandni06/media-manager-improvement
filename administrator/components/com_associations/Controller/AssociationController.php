<?php
/**
 * @package     Joomla.Administrator
 * @subpackage  com_associations
 *
 * @copyright   Copyright (C) 2005 - 2018 Open Source Matters, Inc. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Associations\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\FormController;
use Joomla\Component\Associations\Administrator\Helper\AssociationsHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Session\Session;

/**
 * Association edit controller class.
 *
 * @since  3.7.0
 */
class AssociationController extends FormController
{
	/**
	 * Method to edit an existing record.
	 *
	 * @param   string  $key     The name of the primary key of the URL variable.
	 * @param   string  $urlVar  The name of the URL variable if different from the primary key
	 *                           (sometimes required to avoid router collisions).
	 *
	 * @return  boolean  True if access level check and checkout passes, false otherwise.
	 *
	 * @since  3.7.0
	 */
	public function edit($key = null, $urlVar = null)
	{
		list($extensionName, $typeName) = explode('.', $this->input->get('itemtype', '', 'string'), 2);

		$id = $this->input->get('id', 0, 'int');

		// Check if reference item can be edited.
		if (!AssociationsHelper::allowEdit($extensionName, $typeName, $id))
		{
			$this->setMessage(Text::_('JLIB_APPLICATION_ERROR_EDIT_NOT_PERMITTED'), 'error');
			$this->setRedirect(Route::_('index.php?option=com_associations&view=associations', false));

			return false;
		}

		return parent::display();
	}

	/**
	 * Method for canceling the edit action
	 *
	 * @param   string  $key  The name of the primary key of the URL variable.
	 *
	 * @return  void
	 *
	 * @since  3.7.0
	 */
	public function cancel($key = null)
	{
		Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

		list($extensionName, $typeName) = explode('.', $this->input->get('itemtype', '', 'string'), 2);

		// Only check in, if component item type allows to check out.
		if (AssociationsHelper::typeSupportsCheckout($extensionName, $typeName))
		{
			$ids      = array();
			$targetId = $this->input->get('target-id', '', 'string');

			if ($targetId !== '')
			{
				$ids = array_unique(explode(',', $targetId));
			}

			$ids[] = $this->input->get('id', 0, 'int');

			foreach ($ids as $key => $id)
			{
				AssociationsHelper::getItem($extensionName, $typeName, $id)->checkin();
			}
		}

		$this->setRedirect(Route::_('index.php?option=com_associations&view=associations', false));
	}
}
